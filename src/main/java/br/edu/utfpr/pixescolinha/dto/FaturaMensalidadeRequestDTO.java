package br.edu.utfpr.pixescolinha.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record FaturaMensalidadeRequestDTO(
        @NotNull(message = "O ID da turma é obrigatório")
        Long turmaId,

        @NotNull(message = "O mês de referência é obrigatório")
        @Min(value = 1, message = "Mês deve ser entre 1 e 12")
        @Max(value = 12, message = "Mês deve ser entre 1 e 12")
        Integer mesReferencia,

        @NotNull(message = "O ano de referência é obrigatório")
        Integer anoReferencia,

        @NotNull(message = "A data de vencimento é obrigatória")
        LocalDate dataVencimento
) {}