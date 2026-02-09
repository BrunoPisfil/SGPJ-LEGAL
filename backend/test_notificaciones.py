"""
Script para probar el sistema de notificaciones automáticas
Ejecutar: python test_notificaciones.py
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Configuración
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

# Colores para output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def test_api_connection():
    """Prueba 1: Conectividad con la API"""
    print_header("Prueba 1: Conectividad con la API")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print_success(f"API conectada: {response.json()}")
            return True
        else:
            print_error(f"API retornó código: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"No se puede conectar a la API: {e}")
        print_info("Asegúrate de que el backend está corriendo en http://localhost:8000")
        return False

def test_notification_status():
    """Prueba 2: Estado del sistema de notificaciones"""
    print_header("Prueba 2: Estado del Sistema de Notificaciones")
    
    try:
        response = requests.get(f"{API_URL}/admin/notificaciones-automaticas/status")
        
        if response.status_code == 200:
            data = response.json()
            print_success("Sistema de notificaciones activo")
            print_info(f"Timestamp: {data['timestamp']}")
            print_info(f"Scheduler habilitado: {data['scheduler']['enabled']}")
            print_info(f"Intervalo de verificación: {data['scheduler']['check_interval_minutes']} minutos")
            print_info(f"Próxima verificación: {data['scheduler']['next_check']}")
            
            pending = data['pending']
            print(f"\n{Colors.BOLD}Pendientes para notificar:{Colors.ENDC}")
            print(f"  • Audiencias próximas: {pending['audiencias_proximas']}")
            print(f"  • Diligencias próximas: {pending['diligencias_proximas']}")
            print(f"  • Procesos sin revisar: {pending['procesos_sin_revisar']}")
            
            return True
        else:
            print_error(f"Error: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error al obtener estado: {e}")
        return False

def test_diligencias_proximas():
    """Prueba 3: Ver diligencias próximas a notificar"""
    print_header("Prueba 3: Diligencias Próximas a Notificar")
    
    try:
        response = requests.get(f"{API_URL}/admin/notificaciones-automaticas/diligencias/proximas")
        
        if response.status_code == 200:
            data = response.json()
            
            if data['total'] == 0:
                print_warning("No hay diligencias programadas para mañana sin notificar")
            else:
                print_success(f"Se encontraron {data['total']} diligencias para notificar")
                print(f"\n{Colors.BOLD}Fecha de notificación: {data['fecha_notificacion']}{Colors.ENDC}\n")
                
                for diligencia in data['diligencias']:
                    print(f"📋 {Colors.BOLD}{diligencia['titulo']}{Colors.ENDC}")
                    print(f"   ID: {diligencia['id']}")
                    print(f"   Motivo: {diligencia['motivo']}")
                    print(f"   Fecha: {diligencia['fecha']} a las {diligencia['hora']}")
                    print(f"   Estado: {diligencia['estado']}")
                    print(f"   Notificada: {'Sí' if diligencia['notificacion_enviada'] else 'No'}")
                    print()
            
            return True
        else:
            print_error(f"Error: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error al obtener diligencias próximas: {e}")
        return False

def test_manual_check():
    """Prueba 4: Ejecutar verificación manual"""
    print_header("Prueba 4: Ejecutar Verificación Manual Ahora")
    
    try:
        print_info("Ejecutando verificación manual...")
        response = requests.post(f"{API_URL}/admin/notificaciones-automaticas/check-now")
        
        if response.status_code == 200:
            data = response.json()
            print_success(data['message'])
            
            results = data['results']
            print(f"\n{Colors.BOLD}Resultados:{Colors.ENDC}")
            print(f"  • Audiencias notificadas: {results['audiencias_notificadas']}")
            print(f"  • Diligencias notificadas: {results['diligencias_notificadas']}")
            print(f"  • Procesos notificados: {results['procesos_notificados']}")
            
            if results['errors']:
                print(f"\n{Colors.FAIL}Errores encontrados:{Colors.ENDC}")
                for error in results['errors']:
                    print(f"  • {error}")
            
            return True
        else:
            print_error(f"Error: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error ejecutando verificación: {e}")
        return False

def test_recent_logs():
    """Prueba 5: Ver logs recientes"""
    print_header("Prueba 5: Logs Recientes de Notificaciones")
    
    try:
        response = requests.get(
            f"{API_URL}/admin/notificaciones-automaticas/logs/recent",
            params={
                "limit": 10,
                "type_filter": "DILIGENCIA_RECORDATORIO"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data['count'] == 0:
                print_warning("No hay logs de notificaciones de diligencias")
            else:
                print_success(f"Mostrando {data['count']} logs recientes")
                print(f"\n{Colors.BOLD}Logs de Notificaciones de Diligencias:{Colors.ENDC}\n")
                
                for notif in data['notificaciones']:
                    estado_color = Colors.OKGREEN if notif['estado'] == 'ENVIADO' else Colors.WARNING
                    print(f"{estado_color}[{notif['estado']}]{Colors.ENDC} {Colors.BOLD}{notif['titulo']}{Colors.ENDC}")
                    print(f"   ID: {notif['id']}")
                    print(f"   Destino: {notif['email_destinatario']}")
                    print(f"   Creado: {notif['fecha_creacion']}")
                    
                    if notif['fecha_envio']:
                        print(f"   Enviado: {notif['fecha_envio']}")
                    
                    if notif['error_mensaje']:
                        print(f"   {Colors.FAIL}Error: {notif['error_mensaje']}{Colors.ENDC}")
                    
                    print()
            
            return True
        else:
            print_error(f"Error: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error al obtener logs: {e}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    print(f"\n{Colors.BOLD}{Colors.OKBLUE}")
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║   SISTEMA DE NOTIFICACIONES AUTOMÁTICAS - TEST SUITE     ║
    ║                  SGPJ Legal v1.0                         ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    print(Colors.ENDC)
    
    results = []
    
    # Ejecutar pruebas
    results.append(("Conectividad API", test_api_connection()))
    
    if results[-1][1]:  # Si la API está conectada, continuar
        results.append(("Estado Notificaciones", test_notification_status()))
        results.append(("Diligencias Próximas", test_diligencias_proximas()))
        results.append(("Verificación Manual", test_manual_check()))
        results.append(("Logs Recientes", test_recent_logs()))
    
    # Resumen
    print_header("Resumen de Pruebas")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{Colors.OKGREEN}PASÓ{Colors.ENDC}" if result else f"{Colors.FAIL}FALLÓ{Colors.ENDC}"
        print(f"{status} - {test_name}")
    
    print(f"\n{Colors.BOLD}Total: {passed}/{total} pruebas pasadas{Colors.ENDC}\n")
    
    if passed == total:
        print_success("¡Todas las pruebas pasaron! El sistema está funcionando correctamente.")
        print_info("Las notificaciones se enviarán automáticamente cada 60 minutos.")
    else:
        print_warning("Algunas pruebas fallaron. Revisa los detalles arriba.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}Pruebas interrumpidas por el usuario{Colors.ENDC}\n")
    except Exception as e:
        print(f"\n{Colors.FAIL}Error inesperado: {e}{Colors.ENDC}\n")
