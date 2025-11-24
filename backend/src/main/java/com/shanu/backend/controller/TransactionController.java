package com.shanu.backend.controller;

import com.shanu.backend.model.Transaction;
import com.shanu.backend.model.User;
import com.shanu.backend.service.AuthService;
import com.shanu.backend.service.TransactionService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import com.shanu.backend.repository.TransactionRepository;

import java.util.*;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:5173")
public class TransactionController {

    private final TransactionService transactionService;
    @Autowired
    private TransactionRepository transactionRepository;
    private final AuthService authService;

    public TransactionController(TransactionService transactionService, AuthService authService) {
        this.transactionService = transactionService;
        this.authService = authService;
    }

    @PostMapping("/add")
    public ResponseEntity<?> addTransaction(
            @RequestHeader("Authorization") String token,
            @RequestBody Transaction txn) {

        try {
            User user = authService.getUserFromToken(token);
            txn.setUserId(user.getId());
            Transaction savedTxn = transactionService.addTransaction(txn);
            return ResponseEntity.ok(savedTxn);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> getUserTransactions(@RequestHeader("Authorization") String token) {
        try {
            User user = authService.getUserFromToken(token);
            List<Transaction> txns = transactionService.getTransactionsByUser(user.getId());
            return ResponseEntity.ok(txns);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // @PutMapping("/{id}")
    // public ResponseEntity<?> updateTransaction(@PathVariable String id, @RequestBody Transaction txn) {
    //     return ResponseEntity.ok(transactionService.updateTransaction(id, txn));
    // }


    @PutMapping("/{id}")
public ResponseEntity<?> updateTransaction(
        @RequestHeader("Authorization") String token,
        @PathVariable String id,
        @RequestBody Transaction updatedTxn
) {
    try {
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        User user = authService.getUserFromToken(cleanToken);

        Transaction existing = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!existing.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "You can only update your own transactions"));
        }

        existing.setType(updatedTxn.getType());
        existing.setCategory(updatedTxn.getCategory());
        existing.setAmount(updatedTxn.getAmount());
        existing.setDescription(updatedTxn.getDescription());
        existing.setDate(updatedTxn.getDate());
        Transaction saved = transactionRepository.save(existing);

        return ResponseEntity.ok(saved);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Failed to update transaction: " + e.getMessage()));
    }
}


    // @DeleteMapping("/{id}")
    // public ResponseEntity<?> deleteTransaction(@PathVariable String id) {
    //     transactionService.deleteTransaction(id);
    //     return ResponseEntity.ok(Map.of("message", "Transaction deleted successfully"));
    // }


    @DeleteMapping("/{id}")
public ResponseEntity<?> deleteTransaction(
        @RequestHeader("Authorization") String token,
        @PathVariable(required = false) String id
) {
    try {
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        User user = authService.getUserFromToken(cleanToken);

        Transaction existing = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!existing.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "You can only delete your own transactions"));
        }

        transactionRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Transaction deleted successfully"));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Failed to delete transaction: " + e.getMessage()));
    }
}

}
