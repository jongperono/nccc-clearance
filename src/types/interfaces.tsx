export interface Employee {
  id?: number;
  employee_id: string | number;
  full_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_number: string | number;
  email: string;
  password?: string;
  generated_password?: string;
  role_id: string;
  branch_id: string;
  department_id: string;
  company_id: string;
  account_creator?: string;
  is_signatory: boolean;
  can_assign_clearances: boolean;
  can_create_roles: boolean;
  can_create_accounts: boolean;
  can_create_companies: boolean;
  can_create_departments: boolean;
  can_create_branches: boolean;
  can_create_templates: boolean;
  can_access_logs: boolean;
  can_access_all_clearances: boolean;
  can_create_clearance_requests: boolean;
  can_clear_clearances: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Company {
  company_id: string;
  company_name: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Role {
  role_id: string;
  role_name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Branch {
  branch_id: string;
  branch_name: string;
  location: string;
  contact_number?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Department {
  department_id: string;
  department_name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Template {
  template_id?: number;
  creator_employee_id: number;
  updater_employee_id?: number;
  title: string;
  purpose: string;
  footer_message?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  creator_employee?: Employee;
}

export interface TemplateSignatory {
  template_id: number;
  employee_id: number;
  employee?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface Clearance {
  id?: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  company_id: string;
  branch_id: string;
  department_id: string;
  type: string;
  assigned_by?: number;
  clearance_status: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  Company?: Company;
  Branch?: Branch;
  Department?: Department;
  assigner?: Employee;
  signatories?: ClearanceSignatory[];
}

export interface ClearanceSignatory {
  clearance_id: number;
  signatory_id: number;
  is_approved?: boolean;
  date_approved?: string;
  createdAt?: string;
  updatedAt?: string;
  Employee?: Employee;
  Clearance?: Clearance;
}

export interface Remark {
  clearance_id: number;
  employee_id: number;
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyDepartment {
  company_id: string;
  department_id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  Department?: Department;
  company?: Company;
}

export interface ApiResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data: T;
}

// Legacy interface for backward compatibility
export interface TemplateData {
  template_id?: number;
  title: string;
  department_id: string;
  branch_id: string;
  purpose: string;
  footer_message?: string;
  creator_employee_id: number;
}
