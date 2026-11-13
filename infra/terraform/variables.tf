variable "tenancy_ocid" {
  description = "Oracle Cloud Identifier (OCID) della tenancy, cioè dell’intero account Oracle"
  type        = string
}
variable "region" {
  description = "Regione OCI dove creiamo le risorse"
  type        = string
  default     = "eu-milan-1"
}
variable "compartment_ocid" {
  description = "Compartimento dove si lavora"
  type        = string
}