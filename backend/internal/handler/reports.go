package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/client"
	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/models"
	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/store"
	"github.com/google/uuid"
)

type ReportHandler struct {
	AI    *client.AIService
	Store *store.MemoryStore
	Demo  bool
}

func NewReportHandler(ai *client.AIService, st *store.MemoryStore) *ReportHandler {
	demo := os.Getenv("DEMO_MODE") == "true"
	return &ReportHandler{AI: ai, Store: st, Demo: demo}
}

func (h *ReportHandler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(20 << 20); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	lat, _ := strconv.ParseFloat(r.FormValue("lat"), 64)
	lng, _ := strconv.ParseFloat(r.FormValue("lng"), 64)
	if lat == 0 && lng == 0 {
		lat, lng = 41.0931, 28.8022 // Başakşehir demo default
	}

	file, _, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "image required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	image, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "read image failed", http.StatusInternalServerError)
		return
	}

	report, err := h.processReport(image, lat, lng)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	h.Store.Add(*report)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(report)
}

func (h *ReportHandler) processReport(image []byte, lat, lng float64) (*models.Report, error) {
	pipe, err := h.AI.Pipeline(image)
	if err != nil {
		if h.Demo {
			return demoReport(lat, lng), nil
		}
		return nil, fmt.Errorf("ai pipeline: %w", err)
	}

	vtype := pipe.Severity.PrimaryType
	if vtype == "" && len(pipe.Detections) > 0 {
		vtype = pipe.Detections[0].Type
	}
	if vtype == "" {
		vtype = "sidewalk_occupation"
	}

	sevMap := map[string]interface{}{
		"score": pipe.Severity.Score,
		"level": pipe.Severity.Level,
	}
	pet, err := h.AI.Petition(vtype, lat, lng, sevMap)
	if err != nil {
		return nil, fmt.Errorf("ai petition: %w", err)
	}

	dets := make([]models.Detection, 0, len(pipe.Detections))
	for _, d := range pipe.Detections {
		dets = append(dets, models.Detection{
			Type: d.Type, Label: d.Label, Confidence: d.Confidence, BBox: d.BBox,
		})
	}

	refs := make([]models.LegalRef, 0, len(pet.LegalReferences))
	for _, lr := range pet.LegalReferences {
		refs = append(refs, models.LegalRef{
			Source: lr.Source, Heading: lr.Heading, Text: lr.Text, Score: lr.Score,
		})
	}

	auth := models.Authority{}
	if pet.Authority != nil {
		auth.ViolationType, _ = pet.Authority["violation_type"].(string)
		auth.Authority, _ = pet.Authority["authority"].(string)
		auth.Channel, _ = pet.Authority["channel"].(string)
		auth.LawRef, _ = pet.Authority["law_ref"].(string)
		auth.Reason, _ = pet.Authority["reason"].(string)
	}

	return &models.Report{
		ID:          uuid.New().String(),
		CreatedAt:   time.Now().UTC(),
		Lat:         lat,
		Lng:         lng,
		ImageBase64: pipe.ImageBase64,
		BlurCount:   pipe.BlurCount,
		Detections:  dets,
		Severity: models.Severity{
			Score: pipe.Severity.Score, Level: pipe.Severity.Level,
			PrimaryType: pipe.Severity.PrimaryType, PrimaryLabel: pipe.Severity.PrimaryLabel,
		},
		ViolationType:   vtype,
		ViolationLabel:  pet.ViolationLabel,
		Authority:       auth,
		LegalReferences: refs,
		Petition:        pet.Petition,
	}, nil
}

func demoReport(lat, lng float64) *models.Report {
	return &models.Report{
		ID:            uuid.New().String(),
		CreatedAt:     time.Now().UTC(),
		Lat:           lat,
		Lng:           lng,
		BlurCount:     2,
		ViolationType: "sidewalk_occupation",
		ViolationLabel: "Kaldırım işgali",
		Severity:      models.Severity{Score: 72, Level: "critical", PrimaryType: "sidewalk_occupation"},
		Authority: models.Authority{
			Authority: "İlçe Belediyesi Zabıta Müdürlüğü",
			Channel:   "CİMER / 153",
			LawRef:    "5326 md. 32, 38",
		},
		Petition: "Demo modu — örnek dilekçe metni.",
		Demo:     true,
	}
}

func (h *ReportHandler) List(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(h.Store.List())
}

func (h *ReportHandler) Map(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(h.Store.MapPins())
}

func (h *ReportHandler) Stats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(h.Store.Stats())
}
