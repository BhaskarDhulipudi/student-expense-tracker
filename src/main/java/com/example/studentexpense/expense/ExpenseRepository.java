package com.example.studentexpense.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findAllByOrderByUpdatedAtAsc();
    Expense findByClientId(String clientId);
}
