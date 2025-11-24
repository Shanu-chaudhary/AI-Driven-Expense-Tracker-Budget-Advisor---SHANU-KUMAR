package com.shanu.backend.service;

import com.shanu.backend.model.Transaction;
import com.shanu.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    // Create Transaction
    public Transaction addTransaction(Transaction txn) {
        txn.setCreatedAt(new Date());
        txn.setUpdatedAt(new Date());
        return transactionRepository.save(txn);
    }

    // Get All Transactions for User
    public List<Transaction> getTransactionsByUser(String userId) {
        return transactionRepository.findByUserId(userId);
    }

    // Update Transaction
    public Transaction updateTransaction(String id, Transaction updatedTxn) {
        Transaction existing = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        existing.setType(updatedTxn.getType());
        existing.setCategory(updatedTxn.getCategory());
        existing.setAmount(updatedTxn.getAmount());
        existing.setDescription(updatedTxn.getDescription());
        existing.setDate(updatedTxn.getDate());
        existing.setUpdatedAt(new Date());

        return transactionRepository.save(existing);
    }

    // Delete Transaction
    public void deleteTransaction(String id) {
        transactionRepository.deleteById(id);
    }
}