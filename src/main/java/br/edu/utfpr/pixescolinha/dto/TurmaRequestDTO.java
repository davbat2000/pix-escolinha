package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.enums.Turno;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record TurmaRequestDTO(
        @NotBlank(message = "O nome da turma é obrigatório")
        @Size(max = 100, message = "O nome não pode exceder 100 caracteres")
        String nome,

        @NotNull(message = "O turno é obrigatório")
        Turno turno,

        @NotNull(message = "O valor padrão da mensalidade é obrigatório")
        @DecimalMin(value = "0.0", inclusive = false, message = "O valor deve ser maior que zero")
        BigDecimal valorMensalidadePadrao,

        @NotNull(message = "O dia de vencimento padrão é obrigatório")
        @Min(value = 1, message = "O dia deve ser no mínimo 1")
        @Max(value = 31, message = "O dia deve ser no máximo 31")
        Integer diaVencimentoPadrao
) {}