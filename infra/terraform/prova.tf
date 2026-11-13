data "oci_identity_availability_domains" "test_domains" {
  compartment_id = var.tenancy_ocid
}
output "availability_domains" {
  value = data.oci_identity_availability_domains.test_domains.availability_domains[*].name
}