package br.edu.utfpr.pixescolinha.controller;

import br.edu.utfpr.pixescolinha.dto.WebhookAsaasDTO;
import br.edu.utfpr.pixescolinha.service.WebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping("/asaas")
    public ResponseEntity<Void> receberWebhookAsaas(@RequestBody WebhookAsaasDTO payload) {
        webhookService.processarWebhookAsaas(payload);
        return ResponseEntity.ok().build();
    }
}