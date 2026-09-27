package br.edu.utfpr.pixescolinha.dto;

import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.br.CPF;

public record ResponsavelRequestDTO(
        @NotBlank(message = "O nome do responsável é obrigatório")
        String nome,

        @NotBlank(message = "O CPF é obrigatório")
        @CPF(message = "CPF em formato inválido")
        String cpf,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail em formato inválido")
        String email,

        @NotBlank(message = "O WhatsApp é obrigatório")
        @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Telefone WhatsApp inválido (ex: 5543999999999)")
        String whatsapp
) {}