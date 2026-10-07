package com.example.studentexpense.expense;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin
public class ExpenseController {
    private final ExpenseRepository repository;
    public ExpenseController(ExpenseRepository repository){this.repository=repository;}

    @GetMapping public List<Expense> all(){ return repository.findAllByOrderByUpdatedAtAsc(); }

    @PostMapping public Expense save(@Valid @RequestBody ExpenseRequest request){
        Expense e=repository.findByClientId(request.clientId());
        if(e==null)e=new Expense();
        e.setClientId(request.clientId()); e.setCategory(request.category()); e.setAmount(request.amount());
        e.setExpenseDate(request.expenseDate()); e.setNote(request.note()); e.setPaymentMethod(request.paymentMethod());
        e.setDeleted(request.deleted());
        return repository.save(e);
    }

    @DeleteMapping("/{clientId}")
    public ResponseEntity<Void> delete(@PathVariable String clientId){
        Expense e=repository.findByClientId(clientId);
        if(e!=null){e.setDeleted(true);repository.save(e);}
        return ResponseEntity.noContent().build();
    }
}
