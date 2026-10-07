package br.edu.utfpr.pixescolinha.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class AsaasService {

    @Value("${asaas.api.key}")
    private String apiKey;

    @Value("${asaas.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public AsaasPixResponseDTO gerarPixDinamico(
            String txid,
            BigDecimal valor,
            String descricao,
            String cpfPagar,
            String nomePagar,
            LocalDate dataVencimento) {

        try {
            String customerId = obterOuCriarCliente(cpfPagar, nomePagar);
            HttpHeaders headers = criarHeaders();

            Map<String, Object> paymentBody = Map.of(
                    "customer", customerId,
                    "billingType", "PIX",
                    "value", valor,
                    "dueDate", dataVencimento.toString(),
                    "description", descricao,
                    "externalReference", txid
            );

            HttpEntity<Map<String, Object>> requestPayment = new HttpEntity<>(paymentBody, headers);
            ResponseEntity<Map> paymentResponse = restTemplate.postForEntity(apiUrl + "/payments", requestPayment, Map.class);

            String paymentId = (String) paymentResponse.getBody().get("id");

            HttpEntity<Void> requestPix = new HttpEntity<>(headers);
            ResponseEntity<Map> pixResponse = restTemplate.exchange(
                    apiUrl + "/payments/" + paymentId + "/pixQrCode",
                    HttpMethod.GET,
                    requestPix,
                    Map.class
            );

            String qrCodePix = (String) pixResponse.getBody().get("payload");
            String qrCodeBase64 = (String) pixResponse.getBody().get("encodedImage");

            return new AsaasPixResponseDTO(
                    paymentId,
                    txid,
                    qrCodePix,
                    qrCodeBase64,
                    valor,
                    "PENDING"
            );

        } catch (Exception e) {
            throw new RuntimeException("Erro na comunicação com a API do Asaas: " + e.getMessage(), e);
        }
    }

    private String obterOuCriarCliente(String cpf, String nome) {
        HttpHeaders headers = criarHeaders();
        String cpfLimpo = cpf.replaceAll("\\D", "");

        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<Map> searchResponse = restTemplate.exchange(
                apiUrl + "/customers?cpfCnpj=" + cpfLimpo,
                HttpMethod.GET,
                request,
                Map.class
        );

        List<Map<String, Object>> data = (List<Map<String, Object>>) searchResponse.getBody().get("data");
        if (data != null && !data.isEmpty()) {
            return (String) data.get(0).get("id");
        }

        Map<String, Object> customerBody = Map.of(
                "name", nome,
                "cpfCnpj", cpfLimpo
        );

        HttpEntity<Map<String, Object>> createRequest = new HttpEntity<>(customerBody, headers);
        ResponseEntity<Map> createResponse = restTemplate.postForEntity(apiUrl + "/customers", createRequest, Map.class);

        return (String) createResponse.getBody().get("id");
    }

    private HttpHeaders criarHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("access_token", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}