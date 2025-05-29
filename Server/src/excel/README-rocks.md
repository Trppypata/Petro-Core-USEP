# Rocks Database Excel Format

This document describes the Excel format for importing rock data into the Petro-Core database.

## General Guidelines

- The Excel file should contain multiple sheets, one for each rock category (Igneous, Sedimentary, Metamorphic, Ore Samples).
- Each sheet should have header rows with column names matching the expected format.
- Required fields are: Rock Name (or Name), Category, and Type.
- Rock Code is optional but recommended. If not provided, a code will be generated automatically.

## Rock Categories

The system recognizes the following rock categories:

1. **Igneous** - Rocks formed from cooled magma or lava
2. **Sedimentary** - Rocks formed by deposition and cementation of material
3. **Metamorphic** - Rocks formed by transformation of existing rock types
4. **Ore Samples** - Mineral deposits of economic value

## Column Headers by Category

### Common Fields (All Rock Types)

- **Rock Code** - Unique identifier (e.g., I-0001, S-0001)
- **Rock Name** or **Name** - The name of the rock
- **Type** - The specific rock type within the category
- **Chemical Formula** - Chemical composition where applicable
- **Hardness** - Mohs scale hardness
- **Color** - Color description
- **Latitude** - Geographic coordinates (latitude)
- **Longitude** - Geographic coordinates (longitude)
- **Locality** - Location where the rock was found
- **Description** - Detailed description of the rock
- **Image URL** - URL to an image of the rock

### Igneous Rock Specific Fields

- **Silica Content** - Felsic, intermediate, mafic, ultramafic
- **Cooling Rate** - Fast, slow, variable
- **Mineral Content** - Major minerals in the igneous rock
- **Grain Size** - Fine-grained, medium-grained, coarse-grained
- **Texture** - Aphanitic, phaneritic, porphyritic, etc.
- **Depositional Environment** - Where the rock formed (e.g., volcanic, plutonic)

### Sedimentary Rock Specific Fields

- **Bedding** - Layering characteristics
- **Sorting** - Well-sorted, poorly-sorted
- **Roundness** - Angular, subangular, subrounded, rounded
- **Fossil Content** - Describes fossils present, if any
- **Sediment Source** - Source of the sediments (terrigenous, biogenic, etc.)
- **Grain Size** - Size of sediment particles (e.g., clay, silt, sand, gravel)
- **Texture** - Physical appearance (e.g., clastic, non-clastic)
- **Depositional Environment** - Where the rock formed (e.g., marine, fluvial)

### Metamorphic Rock Specific Fields

- **Associated Minerals** - Specific minerals associated with metamorphic rocks
- **Metamorphism Type** - Contact, regional, dynamic, etc.
- **Metamorphic Grade** - Low, medium, high
- **Parent Rock** - Original rock type before metamorphism
- **Foliation** - Whether the rock shows foliation - yes/no/partial
- **Texture** - Foliated, non-foliated, etc.
- **Grain Size** - Fine-grained, medium-grained, coarse-grained

### Ore Sample Specific Fields

- **Commodity Type** - The primary economic mineral (e.g., Gold, Copper)
- **Ore Group** - Classification of the ore (e.g., Hydrothermal, Residual)
- **Mining Company** - The company that mines/owns the sample
- **Color** - Color of the ore
- **Hardness** - Hardness of the ore
- **Description** - Detailed description of the ore
- **Locality** - Location where the ore was found

## Example Format

| Rock Code | Rock Name | Type | Category | Hardness | Color | Locality | Description |
|-----------|-----------|------|----------|----------|-------|----------|-------------|
| I-0001    | Granite   | Plutonic | Igneous | 6-7 | Pink to gray | Cascade Range | Coarse-grained igneous rock |
| S-0001    | Limestone | Chemical | Sedimentary | 3 | White to gray | Cebu, Philippines | Marine sedimentary rock |
| M-0001    | Marble    | Non-foliated | Metamorphic | 3-4 | White | Romblon, Philippines | Metamorphosed limestone |
| O-0001    | Gold-Copper Ore | Hydrothermal | Ore Samples | 3-4 | Gray with metallic luster | Mankayan, Benguet | Epithermal deposit |

## Importing Process

When importing from Excel:

1. Each sheet will be processed and mapped to the appropriate rock category.
2. Rows without a rock name will be skipped.
3. If rock codes are not provided, they will be automatically generated.
4. Category-specific fields will be mapped to the appropriate database columns.
5. Duplicate rock codes will result in updates to existing records.

## Common Issues

- **Missing rock names**: Ensure each row has a name in one of these columns: "Rock Name", "Name", or "Sample Name".
- **Sheet names**: The importer will try to determine the category based on the sheet name. If unsure, include a "Category" column.
- **Special characters**: Avoid special characters in column names.
- **Blank rows**: Remove any blank rows or header rows that might be interpreted as data rows. 