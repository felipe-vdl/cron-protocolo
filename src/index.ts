import { CronJob } from "cron";
import { prisma } from "./db";
import { Protocolo } from "@prisma/client";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      WHATSAPP_API_URL: string;
      WHATSAPP_API_KEY: string;
    }
  }
}

export const sendWhatsApp = async (protocolo: Protocolo) => {
  const protocoloInfo = {
    inscricao: protocolo.num_inscricao
      ? protocolo.num_inscricao
      : "Não se aplica",
    processo: protocolo.num_processo,
    assunto: protocolo.assunto,
    analise: protocolo.anos_analise
      ? protocolo.anos_analise
      : "Não se aplica",
    nome: protocolo.nome,
    cpf: protocolo.cpf.replaceAll(".", "").replaceAll("-", ""),
    whatsapp: protocolo.telefone?.replaceAll("-", ""),
    data: protocolo.created_at.toLocaleDateString("pt-BR"),
  };
  console.log(protocoloInfo);

  const res = await fetch(process.env.WHATSAPP_API_URL, {
    method: "POST",
    body: JSON.stringify(protocoloInfo),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.WHATSAPP_API_KEY,
    },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data);
  }

  const updateProtocolo = await prisma.protocolo.update({
    where: {
      id: protocolo.id,
    },
    data: {
      whatsapp_enviado: true,
    },
  });

  const data = await res.json();
  console.log(data);
  return data;
}

const timezone = "America/Sao_Paulo";

const whatsappJob = new CronJob(
  "*/30 * * * *",
  async () => {
    const protocolosNaoEnviados = await prisma.protocolo.findMany({
      where: {
        enviar_whatsapp: true,
        whatsapp_enviado: false,
      },
    });

    if (protocolosNaoEnviados.length > 0) {
      for (let protocolo of protocolosNaoEnviados) {
        try {
          if (protocolo.telefone) {
            sendWhatsApp(protocolo);
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  },
  null,
  true,
  timezone
);