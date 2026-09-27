package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.enums.Parentesco;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AlunoRequestDTO(
        @NotBlank(message = "O nome do aluno é obrigatório")
        @Size(max = 100, message = "O nome não pode exceder 100 caracteres")
        String nome,

        @NotBlank(message = "O código de matrícula é obrigatório")
        @Size(max = 20, message = "A matrícula não pode exceder 20 caracteres")
        String matriculaCodigo,

        @NotNull(message = "O ID do responsável principal é obrigatório")
        Long responsavelId,

        @NotNull(message = "O grau de parentesco é obrigatório")
        Parentesco parentesco,

        @NotNull(message = "O ID da turma inicial é obrigatório")
        Long turmaId,

        @PositiveOrZero(message = "A porcentagem de bolsa deve ser zero ou positiva")
        BigDecimal porcentagemBolsa
) {}