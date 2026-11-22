package br.edu.utfpr.pixescolinha.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class EvolutionService {

    @Value("${evolution.api.url:http://localhost:8081}")
    private String evolutionUrl;

    @Value("${evolution.api.key:bananadoce22}")
    private String apiKey;

    @Value("${evolution.api.instance:escolinha}")
    private String instanceName;

    private final RestTemplate restTemplate = new RestTemplate();

    public record EvolutionTextPayload(String number, String text, Integer delay) {}

    public void enviarCobrancaPix(String whatsapp, String nomeResponsavel, String nomeAluno,
                                  String descricao, BigDecimal valor, LocalDate vencimento, String qrCodePix) {
        String dataFormatada = vencimento.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String mensagem = String.format(
                "Olá, *%s*!\n\n" +
                        "Segue a cobrança referente ao aluno(a) *%s*:\n" +
                        "📌 *Descrição:* %s\n" +
                        "💰 *Valor:* R$ %.2f\n" +
                        "📅 *Vencimento:* %s\n\n" +
                        "Copie o código *Pix Copia e Cola* abaixo para realizar o pagamento:\n\n" +
                        "%s",
                nomeResponsavel, nomeAluno, descricao, valor, dataFormatada, qrCodePix
        );
        // Dispara em background para nunca travar a resposta da tela
        CompletableFuture.runAsync(() -> enviarMensagemTexto(whatsapp, mensagem));
    }

    public void enviarConfirmacaoPagamento(String whatsapp, String nomeResponsavel, String descricao, BigDecimal valor) {
        String mensagem = String.format(
                "✅ *Pagamento Confirmado!*\n\n" +
                        "Olá, *%s*!\n" +
                        "Confirmamos o recebimento do pagamento de *R$ %.2f* referente a *%s*.\n" +
                        "Muito obrigado!",
                nomeResponsavel, valor, descricao
        );
        CompletableFuture.runAsync(() -> enviarMensagemTexto(whatsapp, mensagem));
    }

    public void enviarMensagemTexto(String numeroWhatsapp, String texto) {
        if (numeroWhatsapp == null || numeroWhatsapp.isBlank()) {
            return;
        }

        String numeroLimpo = numeroWhatsapp.replaceAll("\\D", "");
        if (!numeroLimpo.startsWith("55") && (numeroLimpo.length() == 10 || numeroLimpo.length() == 11)) {
            numeroLimpo = "55" + numeroLimpo;
        }

        boolean enviado = dispararRequisicao(numeroLimpo, texto);

        // Fallback automático do 9º dígito para números brasileiros (55 + DDD + 9 + 8 dígitos = 13 dígitos)
        if (!enviado && numeroLimpo.startsWith("55") && numeroLimpo.length() == 13 && numeroLimpo.charAt(4) == '9') {
            String numeroSemNonoDigito = numeroLimpo.substring(0, 4) + numeroLimpo.substring(5);
            log.info("Tentando reenviar WhatsApp sem o 9º dígito para: {}", numeroSemNonoDigito);
            dispararRequisicao(numeroSemNonoDigito, texto);
        }
    }

    private boolean dispararRequisicao(String numero, String texto) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", apiKey.trim());

            EvolutionTextPayload body = new EvolutionTextPayload(numero, texto, 500);
            var request = new HttpEntity(body, headers);
            String url = evolutionUrl.trim() + "/message/sendText/" + instanceName.trim();

            restTemplate.postForEntity(url, request, String.class);
            log.info("✅ WhatsApp enviado com sucesso via Evolution API para {}", numero);
            return true;
        } catch (HttpClientErrorException e) {
            log.warn("⚠️ Evolution API recusou envio para {} (Status {}): {}", numero, e.getStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.warn("⚠️ Falha de conexão com Evolution API para {}: {}", numero, e.getMessage());
            return false;
        }
    }
}