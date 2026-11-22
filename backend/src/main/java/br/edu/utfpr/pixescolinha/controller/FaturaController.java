package br.edu.utfpr.pixescolinha.controller;

import br.edu.utfpr.pixescolinha.domain.enums.FormaPagamento;
import br.edu.utfpr.pixescolinha.dto.ComprovanteRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaEventualRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaMensalidadeRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaResponseDTO;
import br.edu.utfpr.pixescolinha.service.FaturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/v1/faturas")
@RequiredArgsConstructor
public class FaturaController {

    private final FaturaService faturaService;

    @PostMapping("/mensalidades")
    public ResponseEntity<List<FaturaResponseDTO>> gerarMensalidades(
            @RequestBody @Valid FaturaMensalidadeRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(faturaService.gerarMensalidadesPorTurma(dto));
    }

    @PostMapping("/eventuais")
    public ResponseEntity<List<FaturaResponseDTO>> gerarEventual(
            @RequestBody @Valid FaturaEventualRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(faturaService.gerarCobrancaEventual(dto));
    }

    @PostMapping(value = "/{id:\\d+}/comprovante/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FaturaResponseDTO> uploadArquivoComprovante(
            @PathVariable("id") Long id,
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam(value = "formaPagamento", defaultValue = "PIX") FormaPagamento formaPagamento,
            @RequestParam(value = "observacao", required = false) String observacao,
            @RequestParam(value = "aprovarImediatamente", defaultValue = "false") boolean aprovarImediatamente) {
        return ResponseEntity.ok(
                faturaService.uploadArquivoComprovante(id, arquivo, formaPagamento, observacao, aprovarImediatamente)
        );
    }

    @GetMapping("/{id:\\d+}/comprovante/arquivo")
    public ResponseEntity<Resource> visualizarArquivoComprovante(@PathVariable("id") Long id) {
        Resource resource = faturaService.carregarArquivoComprovante(id);
        String contentType = "application/octet-stream";
        try {
            Path path = Paths.get(resource.getURI());
            String detectado = Files.probeContentType(path);
            if (detectado != null) {
                contentType = detectado;
            }
        } catch (Exception ignored) {}

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @PostMapping("/{id:\\d+}/comprovante")
    public ResponseEntity<FaturaResponseDTO> enviarComprovante(
            @PathVariable("id") Long id,
            @RequestBody @Valid ComprovanteRequestDTO dto) {
        return ResponseEntity.ok(faturaService.registrarComprovanteManual(id, dto));
    }

    @PatchMapping("/{id:\\d+}/aprovar")
    public ResponseEntity<FaturaResponseDTO> aprovarPagamento(@PathVariable("id") Long id) {
        return ResponseEntity.ok(faturaService.aprovarOuBaixarManualmente(id));
    }

    @PatchMapping("/{id:\\d+}/rejeitar")
    public ResponseEntity<FaturaResponseDTO> rejeitarComprovante(
            @PathVariable("id") Long id,
            @RequestParam(value = "motivo", required = false) String motivo) {
        return ResponseEntity.ok(faturaService.rejeitarComprovante(id, motivo));
    }

    @PatchMapping("/{id:\\d+}/cancelar")
    public ResponseEntity<FaturaResponseDTO> cancelarFatura(@PathVariable("id") Long id) {
        return ResponseEntity.ok(faturaService.cancelarFatura(id));
    }

    @GetMapping
    public ResponseEntity<List<FaturaResponseDTO>> listarTodas() {
        return ResponseEntity.ok(faturaService.listarTodas());
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<FaturaResponseDTO> buscarPorId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(faturaService.buscarPorId(id));
    }
}