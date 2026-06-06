package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

type AIService struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewAIService() *AIService {
	url := os.Getenv("AI_SERVICE_URL")
	if url == "" {
		url = "https://nobetci-ai-service.onrender.com"
	}
	return &AIService{
		BaseURL: url,
		HTTPClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

type PipelineResult struct {
	ImageBase64 string `json:"image_base64"`
	BlurCount   int    `json:"blur_count"`
	Detections  []struct {
		Type       string    `json:"type"`
		Label      string    `json:"label"`
		Confidence float64   `json:"confidence"`
		BBox       []float64 `json:"bbox"`
	} `json:"detections"`
	Severity struct {
		Score        int    `json:"score"`
		Level        string `json:"level"`
		PrimaryType  string `json:"primary_type"`
		PrimaryLabel string `json:"primary_label"`
	} `json:"severity"`
	Demo bool `json:"demo"`
}

type PetitionResult struct {
	Petition         string `json:"petition"`
	ViolationType    string `json:"violation_type"`
	ViolationLabel   string `json:"violation_label"`
	Authority        map[string]interface{} `json:"authority"`
	LegalReferences  []struct {
		Source  string  `json:"source"`
		Heading string  `json:"heading"`
		Text    string  `json:"text"`
		Score   float64 `json:"score"`
	} `json:"legal_references"`
}

func (c *AIService) Pipeline(image []byte) (*PipelineResult, error) {
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	part, err := w.CreateFormFile("file", "image.jpg")
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(image); err != nil {
		return nil, err
	}
	w.Close()

	req, err := http.NewRequest("POST", c.BaseURL+"/pipeline", &buf)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ai pipeline %d: %s", resp.StatusCode, string(body))
	}

	var result PipelineResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *AIService) Petition(violationType string, lat, lng float64, severity map[string]interface{}) (*PetitionResult, error) {
	body := map[string]interface{}{
		"violation_type": violationType,
		"lat":            lat,
		"lng":            lng,
		"severity":       severity,
	}
	raw, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", c.BaseURL+"/petition", bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ai petition %d: %s", resp.StatusCode, string(b))
	}

	var result PetitionResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *AIService) Health() error {
	resp, err := c.HTTPClient.Get(c.BaseURL + "/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ai health %d", resp.StatusCode)
	}
	return nil
}
