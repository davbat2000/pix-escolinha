package br.edu.utfpr.pixescolinha.service;

import br.edu.utfpr.pixescolinha.domain.model.Responsavel;
import br.edu.utfpr.pixescolinha.dto.ResponsavelRequestDTO;
import br.edu.utfpr.pixescolinha.dto.ResponsavelResponseDTO;
import br.edu.utfpr.pixescolinha.repository.ResponsavelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResponsavelService {

    private final ResponsavelRepository responsavelRepository;

    @Transactional
    public ResponsavelResponseDTO criar(ResponsavelRequestDTO dto) {
        String cpfLimpo = dto.cpf().replaceAll("\\D", "");

        if (responsavelRepository.existsByCpf(cpfLimpo)) {
            throw new IllegalArgumentException("Já existe um responsável cadastrado com este CPF.");
        }

        Responsavel responsavel = Responsavel.builder()
                .nome(dto.nome())
                .cpf(cpfLimpo)
                .email(dto.email())
                .whatsapp(dto.whatsapp().replaceAll("\\D", ""))
                .build();

        return ResponsavelResponseDTO.fromEntity(responsavelRepository.save(responsavel));
    }

    @Transactional(readOnly = true)
    public List<ResponsavelResponseDTO> listarTodos() {
        return responsavelRepository.findAll().stream()
                .map(ResponsavelResponseDTO::fromEntity)
                .toList();
    }
}