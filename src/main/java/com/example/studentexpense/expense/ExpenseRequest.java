package com.example.studentexpense.expense;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotBlank @Size(max=80) String clientId,
        @NotBlank @Size(max=80) String category,
        @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal amount,
        @NotNull LocalDate expenseDate,
        @Size(max=120) String note,
        @Size(max=40) String paymentMethod,
        boolean deleted) {}
