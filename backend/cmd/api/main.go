// Package main — GEÇİCİ placeholder backend.
// masterfabric-go mimarisi 11:00'de gelince bu dosya o yapıyla değiştirilecek.
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

type healthResponse struct {
	Status  string    `json:"status"`
	Service string    `json:"service"`
	Time    time.Time `json:"time"`
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(healthResponse{
			Status:  "ok",
			Service: "gungoren-proje-backend (placeholder)",
			Time:    time.Now().UTC(),
		})
	})

	// Render PORT env değişkenini atar; lokal için 8080.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	log.Printf("backend dinleniyor: %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("sunucu hatası: %v", err)
	}
}
