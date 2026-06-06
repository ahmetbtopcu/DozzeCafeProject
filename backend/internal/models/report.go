package models

import "time"

type Detection struct {
	Type       string    `json:"type"`
	Label      string    `json:"label"`
	Confidence float64   `json:"confidence"`
	BBox       []float64 `json:"bbox"`
}

type Severity struct {
	Score        int    `json:"score"`
	Level        string `json:"level"`
	PrimaryType  string `json:"primary_type,omitempty"`
	PrimaryLabel string `json:"primary_label,omitempty"`
}

type Authority struct {
	ViolationType string `json:"violation_type"`
	Authority     string `json:"authority"`
	Channel       string `json:"channel"`
	LawRef        string `json:"law_ref"`
	Reason        string `json:"reason,omitempty"`
}

type LegalRef struct {
	Source  string  `json:"source"`
	Heading string  `json:"heading"`
	Text    string  `json:"text"`
	Score   float64 `json:"score"`
}

const (
	ReportStatusPending   = "pending"
	ReportStatusInReview  = "in_review"
	ReportStatusForwarded = "forwarded"
	ReportStatusClosed    = "closed"
)

type Address struct {
	City         string `json:"city,omitempty"`
	District     string `json:"district,omitempty"`
	Neighborhood string `json:"neighborhood,omitempty"`
	Avenue       string `json:"avenue,omitempty"`
	Street       string `json:"street,omitempty"`
	BuildingNo   string `json:"building_no,omitempty"`
}

type Reporter struct {
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Name      string `json:"name,omitempty"`
	Email     string `json:"email,omitempty"`
	Phone     string `json:"phone,omitempty"`
}

type Report struct {
	ID                string      `json:"id"`
	CreatedAt         time.Time   `json:"created_at"`
	Status            string      `json:"status"`
	AdminNote         string      `json:"admin_note,omitempty"`
	Lat               float64     `json:"lat"`
	Lng               float64     `json:"lng"`
	ImageBase64       string      `json:"image_base64,omitempty"`
	BlurCount         int         `json:"blur_count"`
	Detections        []Detection `json:"detections"`
	Severity          Severity    `json:"severity"`
	ViolationType     string      `json:"violation_type"`
	ViolationLabel    string      `json:"violation_label"`
	UserViolationType string      `json:"user_violation_type,omitempty"`
	Details           string      `json:"details,omitempty"`
	Address           Address     `json:"address,omitempty"`
	Reporter          Reporter    `json:"reporter,omitempty"`
	Authority         Authority   `json:"authority"`
	LegalReferences   []LegalRef  `json:"legal_references"`
	Petition          string      `json:"petition"`
	Demo              bool        `json:"demo,omitempty"`
}

type ReportSummary struct {
	ID                string    `json:"id"`
	CreatedAt         time.Time `json:"created_at"`
	Status            string    `json:"status"`
	Lat               float64   `json:"lat"`
	Lng               float64   `json:"lng"`
	ViolationType     string    `json:"violation_type"`
	ViolationLabel    string    `json:"violation_label"`
	UserViolationType string    `json:"user_violation_type,omitempty"`
	Details           string    `json:"details,omitempty"`
	Address           Address   `json:"address,omitempty"`
	Reporter          Reporter  `json:"reporter,omitempty"`
	Severity          Severity  `json:"severity"`
	Demo              bool      `json:"demo,omitempty"`
}

type MapPin struct {
	ID             string  `json:"id"`
	Lat            float64 `json:"lat"`
	Lng            float64 `json:"lng"`
	SeverityScore  int     `json:"severity_score"`
	SeverityLevel  string  `json:"severity_level"`
	ViolationType  string  `json:"violation_type"`
	ViolationLabel string  `json:"violation_label"`
}

type Stats struct {
	TotalReports    int            `json:"total_reports"`
	ByViolationType map[string]int `json:"by_violation_type"`
	BySeverityLevel map[string]int `json:"by_severity_level"`
	AvgSeverity     float64        `json:"avg_severity"`
}
