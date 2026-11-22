package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.enums.Turno;
import br.edu.utfpr.pixescolinha.domain.model.Turma;

import java.math.BigDecimal;

public record TurmaResponseDTO(
        Long id,
        String nome,
        Turno turno,
        BigDecimal valorMensalidadePadrao,
        Integer diaVencimentoPadrao
) {
    public static TurmaResponseDTO fromEntity(Turma turma) {
        return new TurmaResponseDTO(
                turma.getId(),
                turma.getNome(),
                turma.getTurno(),
                turma.getValorMensalidadePadrao(),
                turma.getDiaVencimentoPadrao()
        );
    }
}