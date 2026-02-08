# Gestión de Acceso por Niveles (Tiered Access)

Este documento describe cómo gestionar los niveles de suscripción y acceso en el sistema.

## 1. Niveles de Plan
El sistema soporta tres niveles de plan definidos en la base de datos (`businessmans.plan_type`):

*   **Esencial (`essential`)**
    *   **Límite de Productos:** 30 productos.
    *   **Analíticas:** No tiene acceso al gráfico de tendencias de ventas.
    *   **IA:** No tiene acceso al Agente de IA.
    *   **Enfoque:** Emprendedores y puestos locales.

*   **Profesional (`professional`)**
    *   **Límite de Productos:** Ilimitado.
    *   **Analíticas:** Acceso completo a métricas y tendencias.
    *   **IA:** No tiene acceso.
    *   **Enfoque:** Restaurantes con flujo constante.

*   **Premium (`premium`)**
    *   **Límite de Productos:** Ilimitado.
    *   **Analíticas:** Acceso completo.
    *   **IA:** Acceso completo al Agente de Inteligencia Artificial (Soporte 24/7).
    *   **Enfoque:** Negocios que buscan automatización total.

## 2. Estados de Suscripción
El campo `businessmans.subscription_status` controla el acceso general al dashboard:

*   `active`: Acceso normal según el plan.
*   `past_due`: Acceso bloqueado. El usuario es redirigido a `/dashboard/billing` para actualizar su pago.
*   `canceled`: Acceso bloqueado (similar a `past_due`).

## 3. Gestión Técnica

### Actualizar Plan de un Usuario (SQL)
Para cambiar el plan de un usuario manualmente:

```sql
UPDATE businessmans 
SET plan_type = 'professional', -- o 'essential', 'premium'
    subscription_status = 'active'
WHERE id = 'UUID_DEL_NEGOCIO';
```

### Simular Suscripción Vencida
Para probar el bloqueo de acceso:

```sql
UPDATE businessmans 
SET subscription_status = 'past_due'
WHERE id = 'UUID_DEL_NEGOCIO';
```

### Verificar Límite de Productos (Esencial)
El límite se valida en el Server Action `createProduct` en `lib/actions/products.ts`. Si el usuario es `essential` y ya tiene 30 productos, la creación fallará con un mensaje de error.

### Seguridad RLS
La tabla `products` tiene una política de seguridad (Row Level Security) que impide que los menús públicos carguen productos si el negocio no tiene una suscripción activa (`subscription_status = 'active'`). Esto asegura que si dejan de pagar, su menú digital público deje de funcionar.
