package br.edu.utfpr.pixescolinha.service;

import br.edu.utfpr.pixescolinha.domain.model.Turma;
import br.edu.utfpr.pixescolinha.dto.TurmaRequestDTO;
import br.edu.utfpr.pixescolinha.dto.TurmaResponseDTO;
import br.edu.utfpr.pixescolinha.repository.TurmaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TurmaService {

    private final TurmaRepository turmaRepository;

    @Transactional
    public TurmaResponseDTO criar(TurmaRequestDTO dto) {
        Turma turma = Turma.builder()
                .nome(dto.nome())
                .turno(dto.turno())
                .valorMensalidadePadrao(dto.valorMensalidadePadrao())
                .diaVencimentoPadrao(dto.diaVencimentoPadrao())
                .build();

        return TurmaResponseDTO.fromEntity(turmaRepository.save(turma));
    }

    @Transactional(readOnly = true)
    public List<TurmaResponseDTO> listarTodas() {
        return turmaRepository.findAll().stream()
                .map(TurmaResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public TurmaResponseDTO buscarPorId(Long id) {
        Turma turma = turmaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Turma não encontrada com o ID: " + id));
        return TurmaResponseDTO.fromEntity(turma);
    }
}