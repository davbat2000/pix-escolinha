package br.edu.utfpr.pixescolinha.service;

import br.edu.utfpr.pixescolinha.domain.enums.Parentesco;
import br.edu.utfpr.pixescolinha.domain.model.*;
import br.edu.utfpr.pixescolinha.dto.AlunoRequestDTO;
import br.edu.utfpr.pixescolinha.dto.AlunoResponseDTO;
import br.edu.utfpr.pixescolinha.dto.AlunoUpdateDTO;
import br.edu.utfpr.pixescolinha.dto.MatriculaRequestDTO;
import br.edu.utfpr.pixescolinha.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AlunoService {

    private final AlunoRepository alunoRepository;
    private final ResponsavelRepository responsavelRepository;
    private final TurmaRepository turmaRepository;
    private final MatriculaRepository matriculaRepository;

    @Transactional
    public AlunoResponseDTO cadastrarAluno(AlunoRequestDTO dto) {
        String codigoMatricula = (dto.matriculaCodigo() == null || dto.matriculaCodigo().isBlank())
                ? gerarCodigoMatriculaUnico()
                : dto.matriculaCodigo().trim();

        if (alunoRepository.existsByMatriculaCodigo(codigoMatricula)) {
            throw new IllegalArgumentException("Já existe um aluno com a matrícula informada.");
        }

        Responsavel responsavel = responsavelRepository.findById(dto.responsavelId())
                .orElseThrow(() -> new IllegalArgumentException("Responsável não encontrado ID: " + dto.responsavelId()));

        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new IllegalArgumentException("Turma não encontrada ID: " + dto.turmaId()));

        Aluno aluno = Aluno.builder()
                .nome(dto.nome())
                .matriculaCodigo(codigoMatricula)
                .ativo(true)
                .build();

        AlunoResponsavel alunoResponsavel = AlunoResponsavel.builder()
                .aluno(aluno)
                .responsavel(responsavel)
                .parentesco(dto.parentesco())
                .financeiroPrincipal(true)
                .build();
        aluno.getResponsaveis().add(alunoResponsavel);

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
    public AlunoResponseDTO atualizarAluno(Long id, AlunoUpdateDTO dto) {
        Aluno aluno = alunoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado ID: " + id));

        aluno.setNome(dto.nome());
        if (dto.ativo() != null) {
            aluno.setAtivo(dto.ativo());
            if (!dto.ativo()) {
                aluno.getMatriculas().forEach(m -> m.setAtivo(false));
            }
        }

        if (dto.responsavelId() != null) {
            Responsavel novoResp = responsavelRepository.findById(dto.responsavelId())
                    .orElseThrow(() -> new IllegalArgumentException("Responsável não encontrado ID: " + dto.responsavelId()));

            Parentesco novoParentesco = dto.parentesco() != null ? dto.parentesco() : Parentesco.PAI;

            Optional<AlunoResponsavel> vinculoExistente = aluno.getResponsaveis().stream()
                    .filter(ar -> ar.getResponsavel().getId().equals(novoResp.getId()))
                    .findFirst();

            if (vinculoExistente.isPresent()) {
                // Se já é o mesmo responsável, apenas atualiza o parentesco sem deletar/re-inserir
                aluno.getResponsaveis().forEach(ar -> ar.setFinanceiroPrincipal(false));
                AlunoResponsavel ar = vinculoExistente.get();
                ar.setParentesco(novoParentesco);
                ar.setFinanceiroPrincipal(true);
            } else {
                aluno.getResponsaveis().clear();
                alunoRepository.saveAndFlush(aluno);

                AlunoResponsavel novoVinculo = AlunoResponsavel.builder()
                        .aluno(aluno)
                        .responsavel(novoResp)
                        .parentesco(novoParentesco)
                        .financeiroPrincipal(true)
                        .build();
                aluno.getResponsaveis().add(novoVinculo);
            }
        }

        return AlunoResponseDTO.fromEntity(alunoRepository.save(aluno));
    }

    @Transactional
    public AlunoResponseDTO alternarStatusAluno(Long alunoId) {
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado ID: " + alunoId));

        boolean novoStatus = !Boolean.TRUE.equals(aluno.getAtivo());
        aluno.setAtivo(novoStatus);

        // Se o aluno for desativado, tranca todas as matrículas ativas dele automaticamente
        if (!novoStatus) {
            aluno.getMatriculas().forEach(m -> m.setAtivo(false));
        }

        return AlunoResponseDTO.fromEntity(alunoRepository.save(aluno));
    }

    @Transactional
    public AlunoResponseDTO matricularEmNovaTurma(Long alunoId, MatriculaRequestDTO dto) {
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado ID: " + alunoId));

        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new IllegalArgumentException("Turma não encontrada ID: " + dto.turmaId()));

        BigDecimal bolsa = dto.porcentagemBolsa() != null ? dto.porcentagemBolsa() : BigDecimal.ZERO;

        Optional<Matricula> matriculaExistente = matriculaRepository.findByAlunoIdAndTurmaId(alunoId, dto.turmaId());

        if (matriculaExistente.isPresent()) {
            Matricula m = matriculaExistente.get();
            if (Boolean.TRUE.equals(m.getAtivo())) {
                throw new IllegalArgumentException("Aluno já está matriculado ativamente nesta turma.");
            }
            // Reativa matrícula anteriormente cancelada/trancada
            m.setAtivo(true);
            m.setPorcentagemBolsa(bolsa);
            m.setDataMatricula(LocalDate.now());
            aluno.setAtivo(true);
            return AlunoResponseDTO.fromEntity(alunoRepository.save(aluno));
        }

        Matricula novaMatricula = Matricula.builder()
                .aluno(aluno)
                .turma(turma)
                .porcentagemBolsa(bolsa)
                .dataMatricula(LocalDate.now())
                .ativo(true)
                .build();

        aluno.getMatriculas().add(novaMatricula);
        aluno.setAtivo(true);

        return AlunoResponseDTO.fromEntity(alunoRepository.save(aluno));
    }

    @Transactional
    public AlunoResponseDTO desmatricularDeTurma(Long alunoId, Long turmaId) {
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado ID: " + alunoId));

        Matricula matricula = matriculaRepository.findByAlunoIdAndTurmaId(alunoId, turmaId)
                .orElseThrow(() -> new IllegalArgumentException("Matrícula não encontrada para este aluno e turma."));

        if (!Boolean.TRUE.equals(matricula.getAtivo())) {
            throw new IllegalArgumentException("O aluno já está desmatriculado desta turma.");
        }

        matricula.setAtivo(false);
        matriculaRepository.save(matricula);

        return AlunoResponseDTO.fromEntity(aluno);
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

    private String gerarCodigoMatriculaUnico() {
        int ano = LocalDate.now().getYear();
        String codigo;
        do {
            int aleatorio = ThreadLocalRandom.current().nextInt(10000, 99999);
            codigo = "RA" + ano + aleatorio;
        } while (alunoRepository.existsByMatriculaCodigo(codigo));
        return codigo;
    }

    @Transactional
    public AlunoResponseDTO atualizarBolsaMatricula(Long alunoId, Long turmaId, BigDecimal novaBolsa) {
        if (novaBolsa == null || novaBolsa.compareTo(BigDecimal.ZERO) < 0 || novaBolsa.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("A porcentagem de bolsa deve estar entre 0% e 100%.");
        }

        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado ID: " + alunoId));

        Matricula matricula = matriculaRepository.findByAlunoIdAndTurmaId(alunoId, turmaId)
                .orElseThrow(() -> new IllegalArgumentException("Matrícula não encontrada para este aluno e turma."));

        matricula.setPorcentagemBolsa(novaBolsa);
        matriculaRepository.save(matricula);

        return AlunoResponseDTO.fromEntity(aluno);
    }
}