package handler

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/models"
	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/store"
)

type AdminHandler struct {
	Store *store.MemoryStore
}

func NewAdminHandler(st *store.MemoryStore) *AdminHandler {
	return &AdminHandler{Store: st}
}

type updateStatusRequest struct {
	Status    string `json:"status"`
	AdminNote string `json:"admin_note,omitempty"`
}

func (h *AdminHandler) List(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !h.authorize(r) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(h.Store.ListSummaries())
}

func (h *AdminHandler) Get(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !h.authorize(r) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "invalid report id", http.StatusBadRequest)
		return
	}

	report, ok := h.Store.GetByID(id)
	if !ok {
		http.Error(w, "report not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(report)
}

func (h *AdminHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !h.authorize(r) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "invalid report id", http.StatusBadRequest)
		return
	}

	var req updateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if !isValidStatus(req.Status) {
		http.Error(w, "invalid status", http.StatusBadRequest)
		return
	}

	report, ok := h.Store.UpdateStatus(id, req.Status, req.AdminNote)
	if !ok {
		http.Error(w, "report not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(report)
}

func (h *AdminHandler) authorize(r *http.Request) bool {
	expected := os.Getenv("ADMIN_API_KEY")
	if expected == "" {
		return false
	}
	return r.Header.Get("X-Admin-Key") == expected
}

func isValidStatus(status string) bool {
	switch status {
	case models.ReportStatusPending,
		models.ReportStatusInReview,
		models.ReportStatusForwarded,
		models.ReportStatusClosed:
		return true
	default:
		return false
	}
}
