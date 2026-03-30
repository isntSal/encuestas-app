# Venn Encuestas ??

Un solucionador profesional e interactivo en tiempo real para problemas de **Álgebra de Conjuntos**, en este caso enfocado en diagramas de Venn de tres variables.
Nacido a través de *Vibecoding*, este proyecto demuestra cómo construir una herramienta matemática moderna combinando cálculo en el estado de cliente (Frontend) y almacenamiento en la nube.

## ?? Conceptos Fundamentales Manejados

1. **Álgebra de Conjuntos en código:**
   La aplicación no es solo un dibujo, sino un solucionador matemático. Su 'Core' está estructurado aplicando el **Principio de Inclusión-Exclusión**. Dados los totales de intersecciones por el usuario, el código formula en vivo todos los cálculos exclusivos (ej. Solo A = Total A - (AnB) - (AnC) - (AnBnC)), aislando inteligentemente las métricas y resolviendo los elementos que yacen 'fuera' del universo de las variables dictadas.
   
2. **Dibujado SVG Paramétrico (\<svg>\ en React):**
   Uso intensivo de figuras vectoriales nativas para componer el Diagrama de Venn (3 círculos \<circle>\ desfasados geométricamente en base a coordenadas absolutas cx / cy). Los textos y valores numéricos ubicados en las zonas de intersección se mapean mediante componentes lógicos anclados al cálculo vivo.

3. **Mix Blend Modes (Interactividad Cristalina):**
   Las texturas y multiplicaciones en las superposiciones del Diagrama de Venn se logran inyectando reglas de CSS (mix-blend-mode: multiply y illOpacity) para permitir que la geometría entienda dónde intersecta otra figura creando "colores" nuevos para cada intersección.

4. **Estado Asíncrono Dinámico:**
   Manejo complejo de Hooks de React (\useState\) y control de eventos como \onMouseEnter/\onMouseLeave\, inyectados directamente sobre el lienzo SVG para transformar números absolutos en su representación porcentual calculada referente al Universo indicado al momento.

## ??? Stack y Herramientas Usadas

*   **Vite + React:** Motor estructural del proyecto por su velocidad extrema de recarga dinámica y peso pluma.
*   **Tailwind CSS (v4):** Eje vertebrador del diseño. Interfaz *Premium* (efectos de cristalización, sombreado flotante y gradientes de texto) sin usar ni una línea de código puro de CSS tradicional.
*   **Supabase (BaaS):** Abstracción completa del Backend como servicio. Uso de su SDK (\@supabase/supabase-js\) para lograr un puente directo y sin fricciones hacia nuestra pequeña Base de Datos relacional, guardando persistencia del analizado a un clic de distancia por medio de variables de entorno (\import.meta.env\).
*   **Vibecoding**: Desarrollo conversacional como orquestador de refactorizaciones masivas bajo la premisa de requerir "Qué" es necesario en lugar de programar el "Cómo" imperativo.

---
_Creado a partir del análisis conversacional rápido para llevar un formulario simple a un Solucionador SaaS analítico en la nube._
