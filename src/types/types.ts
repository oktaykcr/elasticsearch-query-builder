export interface ElasticsearchField {
  type: string;
  properties?: { [key: string]: ElasticsearchField };
}

export interface ElasticsearchMapping {
  properties: { [key: string]: ElasticsearchField };
} 