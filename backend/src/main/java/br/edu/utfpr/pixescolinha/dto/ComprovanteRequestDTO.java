package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.enums.FormaPagamento;
import jakarta.validation.constraints.NotBlank;

public record ComprovanteRequestDTO(
        @NotBlank(message = "A URL ou código do comprovante é obrigatório")
        String urlComprovante,
        FormaPagamento formaPagamento,
        String observacao
) {}