import math
from dataclasses import dataclass

@dataclass
class PricingConfig:
    # Базовые тарифы (можно вынести в переменные окружения)
    BASE_PRICE: float = 500.0        # Базовая стоимость подачи (RUB)
    RATE_PER_KM: float = 40.0        # Цена за км
    RATE_PER_KG: float = 10.0        # Цена за кг (физический или объемный)
    VOLUMETRIC_DIVISOR: int = 5000   # Стандарт логистики: см³/5000 = объемный кг

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Рассчитывает расстояние между двумя координатами по формуле гаверсинуса (по прямой).
    Результат в километрах.
    """
    R = 6371  # Радиус Земли в км
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_order_price(
    dist_km: float,
    weight_kg: float,
    length_cm: float,
    width_cm: float,
    height_cm: float
) -> dict:
    """
    Рассчитывает итоговую стоимость доставки и метаданные груза.
    """
    # 1. Расчет объемного веса
    # Объем в м³
    volume_m3 = (length_cm * width_cm * height_cm) / 1_000_000
    # Объемный вес (кг)
    volumetric_weight = (length_cm * width_cm * height_cm) / PricingConfig.VOLUMETRIC_DIVISOR
    
    # 2. Оплачиваемый вес (берем максимум между реальным и объемным)
    chargeable_weight = max(weight_kg, volumetric_weight)
    
    # 3. Формула цены:
    # Цена = База + (Км * Тариф_Км) + (Оплачиваемый_Вес * Тариф_Вес)
    raw_price = (
        PricingConfig.BASE_PRICE +
        (dist_km * PricingConfig.RATE_PER_KM) +
        (chargeable_weight * PricingConfig.RATE_PER_KG)
    )
    
    # Округление до 10 рублей в большую сторону (бизнес-правило)
    total_price = math.ceil(raw_price / 10) * 10
    
    return {
        "price": total_price,
        "distance_km": round(dist_km, 2),
        "volume_m3": round(volume_m3, 4),
        "volumetric_weight": round(volumetric_weight, 2),
        "chargeable_weight": round(chargeable_weight, 2)
    }