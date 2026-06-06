// Package main — GEÇİCİ placeholder backend.
// masterfabric-go mimarisi 11:00'de gelince bu dosya o yapıyla değiştirilecek.
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type healthResponse struct {
	Status  string    `json:"status"`
	Service string    `json:"service"`
	Time    time.Time `json:"time"`
}

type analyzeRequest struct {
	IssueID      string `json:"issueId"`
	District     string `json:"district"`
	Neighborhood string `json:"neighborhood"`
	AddressHint  string `json:"addressHint"`
	ImageName    string `json:"imageName"`
}

type legalBasis struct {
	Title   string `json:"title"`
	Article string `json:"article"`
	Summary string `json:"summary"`
}

type violationProfile struct {
	ID             string       `json:"id"`
	Label          string       `json:"label"`
	Authority      string       `json:"authority"`
	SeverityHint   string       `json:"severityHint"`
	PetitionDemand string       `json:"petitionDemand"`
	LegalBasis     []legalBasis `json:"legalBasis"`
}

type reportResponse struct {
	ID                 string           `json:"id"`
	Violation          violationProfile `json:"violation"`
	Severity           int              `json:"severity"`
	Confidence         float64          `json:"confidence"`
	EvidenceSummary    string           `json:"evidenceSummary"`
	RecommendedChannel string           `json:"recommendedChannel"`
	Petition           string           `json:"petition"`
	Tracking           trackingStatus   `json:"tracking"`
	PrivacyNote        string           `json:"privacyNote"`
}

type trackingStatus struct {
	ReportID   string `json:"reportId"`
	Status     string `json:"status"`
	NextAction string `json:"nextAction"`
	UpdatedAt  string `json:"updatedAt"`
}

type petitionRequest struct {
	ReportID     string `json:"reportId"`
	IssueID      string `json:"issueId"`
	District     string `json:"district"`
	Neighborhood string `json:"neighborhood"`
	AddressHint  string `json:"addressHint"`
}

var violationProfiles = map[string]violationProfile{
	"kaldirim_isgali": {
		ID:             "kaldirim_isgali",
		Label:          "Kaldırım işgali",
		Authority:      "İlçe belediyesi zabıta müdürlüğü / ALO 153",
		SeverityHint:   "Yaya geçişini daraltıyor veya engelliyorsa yüksek öncelik verilir.",
		PetitionDemand: "Kaldırım işgalinin giderilmesi, yaya güvenliğinin sağlanması ve gerekli idari işlemin başlatılması",
		LegalBasis: []legalBasis{
			{Title: "5393 sayılı Belediye Kanunu", Article: "Madde 15", Summary: "Belediye, belde düzeni ve esenliği için gerekli tedbirleri alma yetkisine sahiptir."},
			{Title: "5326 sayılı Kabahatler Kanunu", Article: "Madde 38", Summary: "Ortak kullanım alanının yetkili karara aykırı işgalinde idari yaptırım uygulanabilir."},
		},
	},
	"yol_cukuru": {
		ID:             "yol_cukuru",
		Label:          "Yol çukuru veya zemin bozukluğu",
		Authority:      "İlçe belediyesi fen işleri müdürlüğü / ALO 153",
		SeverityHint:   "Trafik veya yaya güvenliği riski oluşturuyorsa yüksek öncelik verilir.",
		PetitionDemand: "Yol bozukluğunun yerinde incelenmesi, güvenlik tedbiri alınması ve onarımın yapılması",
		LegalBasis: []legalBasis{
			{Title: "5393 sayılı Belediye Kanunu", Article: "Madde 14", Summary: "Belediye, yol ve kentsel altyapı hizmetlerini yapmak veya yaptırmakla görevlidir."},
		},
	},
	"kirik_tabela": {
		ID:             "kirik_tabela",
		Label:          "Kırık veya tehlikeli tabela",
		Authority:      "İlçe belediyesi zabıta müdürlüğü / ilgili yol bakım birimi",
		SeverityHint:   "Düşme, kesici parça veya yönlendirme hatası riski varsa yüksek öncelik verilir.",
		PetitionDemand: "Tabelanın güvenli hale getirilmesi, gerekiyorsa kaldırılması veya yenilenmesi",
		LegalBasis: []legalBasis{
			{Title: "5393 sayılı Belediye Kanunu", Article: "Madde 15", Summary: "Belediye, kent düzenini ve güvenliğini sağlamak için gerekli tedbirleri alabilir."},
		},
	},
	"cop_birikimi": {
		ID:             "cop_birikimi",
		Label:          "Çöp birikimi",
		Authority:      "İlçe belediyesi temizlik işleri müdürlüğü / ALO 153",
		SeverityHint:   "Koku, haşere veya yaya geçişini engelleme varsa orta/yüksek öncelik verilir.",
		PetitionDemand: "Çöp birikiminin kaldırılması, bölgenin temizlenmesi ve tekrarını önleyici denetim yapılması",
		LegalBasis: []legalBasis{
			{Title: "5393 sayılı Belediye Kanunu", Article: "Madde 14", Summary: "Belediye, çevre sağlığı, temizlik ve katı atık hizmetlerini yürütmekle görevlidir."},
		},
	},
	"engelli_rampasi_engeli": {
		ID:             "engelli_rampasi_engeli",
		Label:          "Engelli rampası engeli",
		Authority:      "İlçe belediyesi zabıta müdürlüğü / ALO 153",
		SeverityHint:   "Erişilebilirlik tamamen engelleniyorsa acil/yüksek öncelik verilir.",
		PetitionDemand: "Rampayı engelleyen unsurun kaldırılması ve erişilebilirliğin yeniden sağlanması",
		LegalBasis: []legalBasis{
			{Title: "5378 sayılı Engelliler Hakkında Kanun", Article: "Erişilebilirlik ilkesi", Summary: "Kamuya açık alanlarda engellilerin erişimini kolaylaştıracak düzenlemelerin korunması esastır."},
			{Title: "5393 sayılı Belediye Kanunu", Article: "Madde 14", Summary: "Belediye hizmetleri vatandaşların ihtiyaçlarına uygun ve erişilebilir şekilde sunulur."},
		},
	},
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(healthResponse{
			Status:  "ok",
			Service: "cimer-plus-backend (demo)",
			Time:    time.Now().UTC(),
		})
	})
	mux.HandleFunc("/api/reports/analyze", handleAnalyzeReport)
	mux.HandleFunc("/api/petitions/generate", handleGeneratePetition)
	mux.HandleFunc("/api/reports/", handleGetReport)

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

func handleAnalyzeReport(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "sadece POST desteklenir")
		return
	}

	var req analyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "geçersiz JSON gövdesi")
		return
	}

	profile := selectViolation(req.IssueID)
	response := buildReportResponse(req, profile)
	writeJSON(w, http.StatusOK, response)
}

func handleGeneratePetition(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "sadece POST desteklenir")
		return
	}

	var req petitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "geçersiz JSON gövdesi")
		return
	}

	profile := selectViolation(req.IssueID)
	reportID := req.ReportID
	if reportID == "" {
		reportID = "demo-" + profile.ID
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"reportId":   reportID,
		"petition":   buildPetition(reportID, profile, req.District, req.Neighborhood, req.AddressHint),
		"authority":  profile.Authority,
		"disclaimer": "Bu metin başvuru taslağıdır; resmi hukuki danışmanlık değildir.",
	})
}

func handleGetReport(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "sadece GET desteklenir")
		return
	}

	reportID := strings.TrimPrefix(r.URL.Path, "/api/reports/")
	if reportID == "" {
		writeError(w, http.StatusBadRequest, "rapor id zorunlu")
		return
	}

	writeJSON(w, http.StatusOK, trackingStatus{
		ReportID:   reportID,
		Status:     "Taslak hazır",
		NextAction: "Dilekçeyi kontrol edip CİMER, ALO 153 veya ilgili belediye kanalına kopyalayın.",
		UpdatedAt:  time.Now().UTC().Format(time.RFC3339),
	})
}

func selectViolation(issueID string) violationProfile {
	if profile, ok := violationProfiles[issueID]; ok {
		return profile
	}
	return violationProfiles["kaldirim_isgali"]
}

func buildReportResponse(req analyzeRequest, profile violationProfile) reportResponse {
	reportID := "demo-" + profile.ID
	severity := severityFor(profile.ID)

	return reportResponse{
		ID:                 reportID,
		Violation:          profile,
		Severity:           severity,
		Confidence:         confidenceFor(profile.ID),
		EvidenceSummary:    buildEvidenceSummary(profile, req),
		RecommendedChannel: profile.Authority,
		Petition:           buildPetition(reportID, profile, req.District, req.Neighborhood, req.AddressHint),
		Tracking: trackingStatus{
			ReportID:   reportID,
			Status:     "Taslak hazır",
			NextAction: "Başvuru metnini kontrol edip doğru kuruma iletin.",
			UpdatedAt:  time.Now().UTC().Format(time.RFC3339),
		},
		PrivacyNote: "Ham görüntü saklanmaz; demo akışı cihaz tarafında anonimleştirilmiş önizleme varsayar.",
	}
}

func buildEvidenceSummary(profile violationProfile, req analyzeRequest) string {
	location := strings.TrimSpace(strings.Join([]string{req.Neighborhood, req.District, req.AddressHint}, " "))
	if location == "" {
		location = "belirtilen konum"
	}
	if req.ImageName == "" {
		req.ImageName = "anonimleştirilmiş görsel"
	}
	return req.ImageName + " üzerinden " + location + " için " + profile.Label + " tespiti yapıldı. " + profile.SeverityHint
}

func buildPetition(reportID string, profile violationProfile, district string, neighborhood string, addressHint string) string {
	location := strings.TrimSpace(strings.Join([]string{neighborhood, district, addressHint}, " "))
	if location == "" {
		location = "bildirilen konum"
	}

	basis := profile.LegalBasis[0]
	return "Konu: " + profile.Label + " hakkında inceleme ve işlem talebi\n\n" +
		"Sayın Yetkili,\n\n" +
		location + " adresinde kamu düzeni ve yaya güvenliğini etkileyen \"" + profile.Label + "\" niteliğinde bir ihlal tespit edilmiştir. " +
		"Başvuruya konu durum, " + basis.Title + " " + basis.Article + " kapsamında belediyenin görev ve yetki alanına girmektedir. " +
		basis.Summary + "\n\n" +
		"Talebim: " + profile.PetitionDemand + ".\n\n" +
		"Ek: Anonimleştirilmiş görsel kanıt ve CİMER+ demo rapor numarası (" + reportID + ").\n\n" +
		"Bu metin otomatik oluşturulmuş başvuru taslağıdır; gönderim öncesinde vatandaş tarafından kontrol edilmelidir."
}

func severityFor(issueID string) int {
	switch issueID {
	case "engelli_rampasi_engeli":
		return 92
	case "yol_cukuru":
		return 84
	case "kaldirim_isgali":
		return 78
	case "kirik_tabela":
		return 72
	case "cop_birikimi":
		return 68
	default:
		return 70
	}
}

func confidenceFor(issueID string) float64 {
	switch issueID {
	case "engelli_rampasi_engeli", "yol_cukuru":
		return 0.91
	case "kaldirim_isgali":
		return 0.88
	case "kirik_tabela":
		return 0.84
	case "cop_birikimi":
		return 0.82
	default:
		return 0.75
	}
}

func handlePreflight(w http.ResponseWriter, r *http.Request) bool {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return true
	}
	return false
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
