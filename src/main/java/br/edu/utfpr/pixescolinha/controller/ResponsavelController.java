package br.edu.utfpr.pixescolinha.controller;

import br.edu.utfpr.pixescolinha.dto.ResponsavelRequestDTO;
import br.edu.utfpr.pixescolinha.dto.ResponsavelResponseDTO;
import br.edu.utfpr.pixescolinha.service.ResponsavelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/responsaveis")
@RequiredArgsConstructor
public class ResponsavelController {

    private final ResponsavelService responsavelService;

    @PostMapping
    public ResponseEntity<ResponsavelResponseDTO> criar(@RequestBody @Valid ResponsavelRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(responsavelService.criar(dto));
    }

    @GetMapping
    public ResponseEntity<List<ResponsavelResponseDTO>> listarTodos() {
        return ResponseEntity.ok(responsavelService.listarTodos());
    }
}