// Nöbetçi Go API — masterfabric-go uyumlu orkestrasyon katmanı.
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/client"
	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/handler"
	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/store"
)

type healthResponse struct {
	Status    string    `json:"status"`
	Service   string    `json:"service"`
	AIHealthy bool      `json:"ai_healthy"`
	Time      time.Time `json:"time"`
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	ai := client.NewAIService()
	st := store.NewMemoryStore()
	reports := handler.NewReportHandler(ai, st)
	admin := handler.NewAdminHandler(st)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		aiOK := ai.Health() == nil
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(healthResponse{
			Status:    "ok",
			Service:   "nobetci-backend",
			AIHealthy: aiOK,
			Time:      time.Now().UTC(),
		})
	})

	mux.HandleFunc("/api/reports", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			reports.Create(w, r)
		case http.MethodGet:
			reports.List(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/reports/map", reports.Map)
	mux.HandleFunc("/api/reports/stats", reports.Stats)

	mux.HandleFunc("GET /api/admin/reports", admin.List)
	mux.HandleFunc("GET /api/admin/reports/{id}", admin.Get)
	mux.HandleFunc("PATCH /api/admin/reports/{id}", admin.UpdateStatus)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	log.Printf("Nöbetçi backend dinleniyor: %s (AI: %s)", addr, ai.BaseURL)
	if err := http.ListenAndServe(addr, corsMiddleware(mux)); err != nil {
		log.Fatalf("sunucu hatası: %v", err)
	}
}
