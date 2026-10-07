package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.enums.TipoCobranca;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FaturaEventualRequestDTO(
        @NotBlank(message = "A descrição é obrigatória")
        String descricao,

        @NotNull(message = "O tipo de cobrança é obrigatório")
        TipoCobranca tipoCobranca,

        @NotNull(message = "O valor é obrigatório")
        @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
        BigDecimal valor,

        @NotNull(message = "A data de vencimento é obrigatória")
        LocalDate dataVencimento,

        Long turmaId,

        List<Long> alunoIds
) {}