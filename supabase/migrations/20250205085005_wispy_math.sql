/*
  # Create calculator results table

  1. New Tables
    - `calculator_results`
      - `id` (uuid, primary key)
      - `email` (text, required)
      - `industry` (text, required)
      - `sale_value` (numeric, required)
      - `current_leads` (integer, required)
      - `close_rate` (numeric, required)
      - `marketing_budget` (numeric, required)
      - `projected_revenue` (numeric, required)
      - `extra_revenue` (numeric, required)
      - `roi` (numeric, required)
      - `recommended_package` (text, required)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `calculator_results` table
    - Add policy for inserting data
    - Add policy for reading own data
*/

CREATE TABLE calculator_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  industry text NOT NULL,
  sale_value numeric NOT NULL,
  current_leads integer NOT NULL,
  close_rate numeric NOT NULL,
  marketing_budget numeric NOT NULL,
  projected_revenue numeric NOT NULL,
  extra_revenue numeric NOT NULL,
  roi numeric NOT NULL,
  recommended_package text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE calculator_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert data
CREATE POLICY "Anyone can insert calculator results"
  ON calculator_results
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to read their own data by email
CREATE POLICY "Users can read own calculator results"
  ON calculator_results
  FOR SELECT
  TO public
  USING (email = current_user);