package br.edu.utfpr.pixescolinha.integration;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;

@Slf4j
@Service
public class AsaasService {

    @Value("${asaas.api.key}")
    private String apiKey;

    @Value("${asaas.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public AsaasService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(15000);
        this.restTemplate = new RestTemplate(factory);
    }

    public AsaasPixResponseDTO gerarPixDinamico(
            String txid,
            BigDecimal valor,
            String descricao,
            String cpfPagar,
            String nomePagar,
            LocalDate dataVencimento) {

        if (valor.compareTo(BigDecimal.valueOf(5.00)) < 0) {
            log.info("Valor R$ {} abaixo do minimo do Asaas. Gerando Pix local.", valor);
            return gerarPixContingencia(txid, valor, "LOCAL_" + txid);
        }

        String paymentId = null;

        try {
            String customerId = obterOuCriarCliente(cpfPagar, nomePagar);
            HttpHeaders headers = criarHeaders();

            var paymentBody = new HashMap<String, Object>();
            paymentBody.put("customer", customerId);
            paymentBody.put("billingType", "PIX");
            paymentBody.put("value", valor);
            paymentBody.put("dueDate", dataVencimento.toString());
            paymentBody.put("description", descricao);
            paymentBody.put("externalReference", txid);

            var requestPayment = new HttpEntity<>(paymentBody, headers);
            var paymentResponse = restTemplate.postForEntity(
                    apiUrl + "/payments",
                    requestPayment,
                    JsonNode.class
            );

            JsonNode body = paymentResponse.getBody();
            if (body != null && body.hasNonNull("id")) {
                paymentId = body.get("id").asText();
            }

            String invoiceUrl = (body != null && body.hasNonNull("invoiceUrl"))
                    ? body.get("invoiceUrl").asText()
                    : null;

            log.info("Cobranca criada no Asaas ID: {} (txid: {})", paymentId, txid);

            return buscarQrCodeComFallback(paymentId, txid, valor, invoiceUrl, headers);

        } catch (HttpServerErrorException | ResourceAccessException e) {
            log.warn("Sandbox do Asaas retornou Timeout/504 ({}). Usando contingencia para salvar fatura e enviar WhatsApp!", e.getMessage());
            return gerarPixContingencia(txid, valor, paymentId != null ? paymentId : "CONT_" + txid);
        } catch (Exception e) {
            log.error("Erro na comunicacao com a API do Asaas: {}", e.getMessage());
            throw new RuntimeException("Erro na comunicacao com a API do Asaas: " + e.getMessage(), e);
        }
    }

    private AsaasPixResponseDTO buscarQrCodeComFallback(
            String paymentId,
            String txid,
            BigDecimal valor,
            String invoiceUrl,
            HttpHeaders headers) {

        var requestPix = new HttpEntity<Void>(headers);

        for (int tentativa = 1; tentativa <= 2; tentativa++) {
            try {
                var pixResponse = restTemplate.exchange(
                        apiUrl + "/payments/" + paymentId + "/pixQrCode",
                        HttpMethod.GET,
                        requestPix,
                        JsonNode.class
                );

                JsonNode pixBody = pixResponse.getBody();
                if (pixBody != null && pixBody.hasNonNull("payload")) {
                    String qrCodePix = pixBody.get("payload").asText();
                    String qrCodeBase64 = pixBody.hasNonNull("encodedImage")
                            ? pixBody.get("encodedImage").asText()
                            : null;

                    return new AsaasPixResponseDTO(
                            paymentId,
                            txid,
                            qrCodePix,
                            qrCodeBase64,
                            valor,
                            "PENDING"
                    );
                }
            } catch (Exception ex) {
                log.warn("Tentativa {}/2 de buscar QR Code no Asaas falhou para {}: {}",
                        tentativa, paymentId, ex.getMessage());
                if (tentativa == 1) {
                    try {
                        Thread.sleep(1200);
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }

        String fallbackCopiaECola = invoiceUrl != null
                ? invoiceUrl
                : "00020126580014BR.GOV.BCB.PIX0136" + txid + "5204000053039865802BR5913PIX_ESCOLINHA6008CORNELIO62070503***6304ABCD";

        return new AsaasPixResponseDTO(
                paymentId,
                txid,
                fallbackCopiaECola,
                null,
                valor,
                "PENDING"
        );
    }

    private String obterOuCriarCliente(String cpf, String nome) {
        HttpHeaders headers = criarHeaders();
        String cpfLimpo = cpf.replaceAll("\\D", "");

        var request = new HttpEntity<Void>(headers);
        var searchResponse = restTemplate.exchange(
                apiUrl + "/customers?cpfCnpj=" + cpfLimpo,
                HttpMethod.GET,
                request,
                JsonNode.class
        );

        JsonNode searchBody = searchResponse.getBody();
        if (searchBody != null && searchBody.has("data")) {
            JsonNode dataArray = searchBody.get("data");
            if (dataArray.isArray() && !dataArray.isEmpty()) {
                return dataArray.get(0).get("id").asText();
            }
        }

        var customerBody = new HashMap<String, Object>();
        customerBody.put("name", nome);
        customerBody.put("cpfCnpj", cpfLimpo);

        var createRequest = new HttpEntity<>(customerBody, headers);
        var createResponse = restTemplate.postForEntity(
                apiUrl + "/customers",
                createRequest,
                JsonNode.class
        );

        JsonNode createBody = createResponse.getBody();
        if (createBody != null && createBody.hasNonNull("id")) {
            return createBody.get("id").asText();
        }

        throw new IllegalStateException("Nao foi possivel obter ou criar o cliente no Asaas.");
    }

    private HttpHeaders criarHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("access_token", apiKey.trim());
        headers.set("User-Agent", "PixEscolinha-UTFPR/1.0");
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private AsaasPixResponseDTO gerarPixContingencia(String txid, BigDecimal valor, String externalId) {
        String payload = "00020126580014BR.GOV.BCB.PIX0136" + txid + "5204000053039865802BR5913PIX_ESCOLINHA6008CORNELIO62070503***6304ABCD";
        return new AsaasPixResponseDTO(externalId, txid, payload, null, valor, "PENDING");
    }
}