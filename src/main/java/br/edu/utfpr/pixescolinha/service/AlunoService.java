package br.edu.utfpr.pixescolinha.service;

import br.edu.utfpr.pixescolinha.domain.model.*;
import br.edu.utfpr.pixescolinha.dto.AlunoRequestDTO;
import br.edu.utfpr.pixescolinha.dto.AlunoResponseDTO;
import br.edu.utfpr.pixescolinha.dto.MatriculaRequestDTO;
import br.edu.utfpr.pixescolinha.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlunoService {

    private final AlunoRepository alunoRepository;
    private final ResponsavelRepository responsavelRepository;
    private final TurmaRepository turmaRepository;
    private final MatriculaRepository matriculaRepository;

    @Transactional
    public AlunoResponseDTO cadastrarAluno(AlunoRequestDTO dto) {
        if (alunoRepository.existsByMatriculaCodigo(dto.matriculaCodigo())) {
            throw new IllegalArgumentException("Já existe um aluno com a matrícula informada.");
        }

        Responsavel responsavel = responsavelRepository.findById(dto.responsavelId())
                .orElseThrow(() -> new IllegalArgumentException("Responsável não encontrado ID: " + dto.responsavelId()));

        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new IllegalArgumentException("Turma não encontrada ID: " + dto.turmaId()));

        Aluno aluno = Aluno.builder()
                .nome(dto.nome())
                .matriculaCodigo(dto.matriculaCodigo())
                .ativo(true)
                .build();

        // Vincula o responsável financeiro principal
        AlunoResponsavel alunoResponsavel = AlunoResponsavel.builder()
                .aluno(aluno)
                .responsavel(responsavel)
                .parentesco(dto.parentesco())
                .financeiroPrincipal(true)
                .build();

        aluno.getResponsaveis().add(alunoResponsavel);

        // Vincula a matrícula na turma inicial
        BigDecimal bolsa = dto.porcentagemBolsa() != null ? dto.porcentagemBolsa() : BigDecimal.ZERO;
        Matricula matricula = Matricula.builder()
                .aluno(aluno)
                .turma(turma)
                .porcentagemBolsa(bolsa)
                .dataMatricula(LocalDate.now())
                .ativo(true)
                .build();

        aluno.getMatriculas().add(matricula);

        return AlunoResponseDTO.fromEntity(alunoRepository.save(aluno));
    }

    @Transactional
    public AlunoResponseDTO matricularEmNovaTurma(Long alunoId, MatriculaRequestDTO dto) {
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado ID: " + alunoId));

        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new IllegalArgumentException("Turma não encontrada ID: " + dto.turmaId()));

        matriculaRepository.findByAlunoIdAndTurmaId(alunoId, dto.turmaId())
                .ifPresent(m -> {
                    throw new IllegalArgumentException("Aluno já está matriculado nesta turma.");
                });

        BigDecimal bolsa = dto.porcentagemBolsa() != null ? dto.porcentagemBolsa() : BigDecimal.ZERO;
        Matricula novaMatricula = Matricula.builder()
                .aluno(aluno)
                .turma(turma)
                .porcentagemBolsa(bolsa)
                .dataMatricula(LocalDate.now())
                .ativo(true)
                .build();

        aluno.getMatriculas().add(novaMatricula);

        return AlunoResponseDTO.fromEntity(alunoRepository.save(aluno));
    }

    @Transactional(readOnly = true)
    public List<AlunoResponseDTO> listarTodos() {
        return alunoRepository.findAll().stream()
                .map(AlunoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AlunoResponseDTO buscarPorId(Long id) {
        Aluno aluno = alunoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado ID: " + id));
        return AlunoResponseDTO.fromEntity(aluno);
    }
}