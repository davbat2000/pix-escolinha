package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.enums.Parentesco;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlunoUpdateDTO(
        @NotBlank(message = "O nome do aluno é obrigatório")
        @Size(max = 100, message = "O nome não pode exceder 100 caracteres")
        String nome,
        Boolean ativo,
        Long responsavelId,
        Parentesco parentesco
) {}