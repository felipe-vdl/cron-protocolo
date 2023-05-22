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
  const protocolosNaoEnviados = await prisma.protocolo.findMany({
    where: {
      enviar_whatsapp: true,
      whatsapp_enviado: false
    }
  });

  if (protocolosNaoEnviados.length > 0) {
    for (let protocolo of protocolosNaoEnviados) {
      try {
        const res = await fetch(process.env.WHATSAPP_API_URL, {
          method: "POST",
          body: JSON.stringify({
            inscricao: protocolo.num_inscricao,
            processo: protocolo.num_processo,
            assunto: protocolo.assunto,
            analise: protocolo.anos_analise ?? "Não se aplica",
            nome: protocolo.nome,
            cpf: protocolo.cpf,
            whatsapp: protocolo.telefone,
            data: protocolo.created_at.toLocaleDateString("pt-BR")
          }),
          headers: {
            "Content-Type": "application/json",
          }
        });

        if (res.ok) {
          const updatedProtocolo = await prisma.protocolo.update({
            where: {
              id: protocolo.id,
            },
            data: {
              whatsapp_enviado: true,
            }
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}, null, true, timezone);