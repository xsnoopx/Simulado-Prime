// Compressão de imagens feita no navegador antes de enviar ao suporte.
// Isso mantém os prints leves e reduz o consumo de dados no celular.

export type AnexoSuporte = {
  dataUrl: string;
  nome: string;
  tamanho: number;
};

export const MAX_ANEXOS_SUPORTE = 3;
const MAX_ARQUIVO_BYTES = 8 * 1024 * 1024;

export async function comprimirAnexoSuporte(
  arquivo: File,
): Promise<AnexoSuporte> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
    throw new Error("Use uma imagem JPG, PNG ou WebP.");
  }
  if (arquivo.size > MAX_ARQUIVO_BYTES) {
    throw new Error("A imagem escolhida passa de 8 MB.");
  }

  const original = await new Promise<string>((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolver(String(leitor.result || ""));
    leitor.onerror = () => rejeitar(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(arquivo);
  });

  const imagem = await new Promise<HTMLImageElement>((resolver, rejeitar) => {
    const elemento = new Image();
    elemento.onload = () => resolver(elemento);
    elemento.onerror = () => rejeitar(new Error("Imagem inválida."));
    elemento.src = original;
  });

  const limite = 1600;
  const escala = Math.min(
    1,
    limite / Math.max(imagem.width || 1, imagem.height || 1),
  );
  const largura = Math.max(1, Math.round((imagem.width || 1) * escala));
  const altura = Math.max(1, Math.round((imagem.height || 1) * escala));

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const contexto = canvas.getContext("2d");

  if (!contexto) {
    return { dataUrl: original, nome: arquivo.name, tamanho: arquivo.size };
  }

  contexto.drawImage(imagem, 0, 0, largura, altura);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  const tamanho = Math.round((dataUrl.length * 3) / 4);

  return {
    dataUrl,
    nome: `${arquivo.name.replace(/\.[^.]+$/, "") || "print"}.jpg`,
    tamanho,
  };
}

export function formatarTamanhoAnexo(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
