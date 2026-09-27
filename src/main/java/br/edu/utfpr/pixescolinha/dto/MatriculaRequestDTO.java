package br.edu.utfpr.pixescolinha.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record MatriculaRequestDTO(
        @NotNull(message = "O ID da turma é obrigatório")
        Long turmaId,

        @PositiveOrZero(message = "A porcentagem de bolsa deve ser zero ou positiva")
        BigDecimal porcentagemBolsa
) {}