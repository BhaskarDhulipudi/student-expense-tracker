package com.example.studentexpense.expense;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses", indexes = {
        @Index(name = "idx_expense_date", columnList = "expense_date"),
        @Index(name = "idx_expense_updated", columnList = "updated_at")
})
public class Expense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", nullable = false, unique = true, length = 80)
    private String clientId;
    @Column(nullable = false, length = 80) private String category;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amount;
    @Column(name = "expense_date", nullable = false) private LocalDate expenseDate;
    @Column(length = 120) private String note;
    @Column(name = "payment_method", length = 40) private String paymentMethod;
    @Column(nullable = false) private boolean deleted;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;

    public Expense() {}
    @PrePersist @PreUpdate public void touch() { updatedAt = LocalDateTime.now(); }
    public Long getId(){return id;} public String getClientId(){return clientId;} public void setClientId(String v){clientId=v;}
    public String getCategory(){return category;} public void setCategory(String v){category=v;}
    public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal v){amount=v;}
    public LocalDate getExpenseDate(){return expenseDate;} public void setExpenseDate(LocalDate v){expenseDate=v;}
    public String getNote(){return note;} public void setNote(String v){note=v;}
    public String getPaymentMethod(){return paymentMethod;} public void setPaymentMethod(String v){paymentMethod=v;}
    public boolean isDeleted(){return deleted;} public void setDeleted(boolean v){deleted=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;}
}
