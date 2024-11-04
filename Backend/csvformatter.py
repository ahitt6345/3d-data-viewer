import csv

def format_csv_headers(input_file, output_file):
    # Open the input file and read its contents with UTF-8 encoding
    with open(input_file, mode='r', newline='', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        headers = next(reader)  # Read the header row

        # Format headers: lowercase and replace spaces with underscores
        formatted_headers = [header.lower().replace(' ', '_') for header in headers]

        # Open the output file and write the modified contents with UTF-8 encoding
        with open(output_file, mode='w', newline='', encoding='utf-8') as outfile:
            writer = csv.writer(outfile)
            writer.writerow(formatted_headers)  # Write formatted headers
            writer.writerows(reader)  # Write the rest of the data
# Example usage
input_csv = 'gendata_cleaned_up.csv'
output_csv = 'gendata_headers_cleaned_up.csv'
format_csv_headers(input_csv, output_csv)
