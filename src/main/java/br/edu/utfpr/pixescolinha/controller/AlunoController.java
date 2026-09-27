package br.edu.utfpr.pixescolinha.controller;

import br.edu.utfpr.pixescolinha.dto.AlunoRequestDTO;
import br.edu.utfpr.pixescolinha.dto.AlunoResponseDTO;
import br.edu.utfpr.pixescolinha.dto.MatriculaRequestDTO;
import br.edu.utfpr.pixescolinha.service.AlunoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alunos")
@RequiredArgsConstructor
public class AlunoController {

    private final AlunoService alunoService;

    @PostMapping
    public ResponseEntity<AlunoResponseDTO> cadastrar(@RequestBody @Valid AlunoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alunoService.cadastrarAluno(dto));
    }

    @PostMapping("/{id}/matriculas")
    public ResponseEntity<AlunoResponseDTO> matricularEmNovaTurma(
            @PathVariable Long id,
            @RequestBody @Valid MatriculaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alunoService.matricularEmNovaTurma(id, dto));
    }

    @GetMapping
    public ResponseEntity<List<AlunoResponseDTO>> listarTodos() {
        return ResponseEntity.ok(alunoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlunoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(alunoService.buscarPorId(id));
    }
}