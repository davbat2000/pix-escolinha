package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.model.Responsavel;

public record ResponsavelResponseDTO(
        Long id,
        String nome,
        String cpf,
        String email,
        String whatsapp
) {
    public static ResponsavelResponseDTO fromEntity(Responsavel responsavel) {
        return new ResponsavelResponseDTO(
                responsavel.getId(),
                responsavel.getNome(),
                responsavel.getCpf(),
                responsavel.getEmail(),
                responsavel.getWhatsapp()
        );
    }
}