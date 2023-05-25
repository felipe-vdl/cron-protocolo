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
          if (protocolo.telefone) {
            const protocoloInfo = {
              inscricao: protocolo.num_inscricao ?? "Não se aplica",
              processo: protocolo.num_processo,
              assunto: protocolo.assunto,
              analise: protocolo.anos_analise ?? "Não se aplica",
              nome: protocolo.nome,
              cpf: protocolo.cpf.replaceAll(".", "").replaceAll("-", ""),
              whatsapp: protocolo.telefone?.replaceAll("-", ""),
              data: protocolo.created_at.toLocaleDateString("pt-BR")
            }
            console.log(protocoloInfo);
            
            const res = await fetch(process.env.WHATSAPP_API_URL, {
              method: "POST",
              body: JSON.stringify(protocoloInfo),
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
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}, null, true, timezone);