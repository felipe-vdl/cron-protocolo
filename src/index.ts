import { CronJob } from "cron";
import { prisma } from "./db";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      WHATSAPP_API_URL: string;
      WHATSAPP_API_KEY: string;
    }
  }
}

const timezone = 'America/Sao_Paulo';

const whatsappJob = new CronJob('*/30 * * * *', async () => {
  const registrosNaoEnviados = await prisma.protocolo.findMany({
    where: {
      enviar_whatsapp: true,
      whatsapp_enviado: false
    }
  });

  if (registrosNaoEnviados.length > 0) {
    for (let registro of registrosNaoEnviados) {
      try {
        const res = await fetch(process.env.WHATSAPP_API_URL, {
          method: "POST",
          body: JSON.stringify({
            inscricao: registro.num_inscricao,
            processo: registro.num_processo,
            assunto: registro.assunto,
            analise: registro.anos_analise ?? "Não se aplica",
            nome: registro.nome,
            cpf: registro.cpf,
            whatsapp: registro.telefone,
            data: registro.created_at.toLocaleDateString("pt-BR")
          }),
          headers: {
            "Content-Type": "application/json",
          }
        });

        if (res.ok) {
          const updatedProtocolo = await prisma.protocolo.update({
            where: {
              id: registro.id,
            },
            data: {
              whatsapp_enviado: true,
            }
          });

          console.log("Success!");
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}, null, true, timezone);
// whatsappJob.start(); // Method for starting, when Auto Start is set to false.

// const testJob = new CronJob('* * * * * *', async () => {
//   console.log("Testing Cron Job");
// }, null, true, timezone);