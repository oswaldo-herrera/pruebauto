from django import template
import base64
import requests

register = template.Library()

@register.filter()
def get_tranfer_type_cve(transfer_type):
    tranfer_type_options = {
        'DEPARTURES':'S',
        'ARRIVALS':'L',
        'INTERHOTEL':'I',
    }
    return tranfer_type_options[transfer_type]

@register.filter
def to_base64(image_url):
    print("URL: {}".format(image_url))
    try:
        response = requests.get(image_url)
        response.raise_for_status()  # Asegura que la solicitud fue exitosa
        encoded_string = base64.b64encode(response.content).decode('utf-8')
        return encoded_string
    except requests.exceptions.RequestException as e:
        print(f"Error al obtener la imagen: {e}")
    except Exception as e:
        print(f"Error al convertir a base64: {e}")
    return ""

@register.simple_tag
def get_flight(flight, field):
    return getattr(flight, field)

@register.filter()
def currency(value, args):
    import locale
    locale.setlocale( locale.LC_ALL, 'en_US.UTF-8' )
    if args == "abs":
        return locale.currency(abs(value),symbol=False)
    return locale.currency(value,symbol=False)

@register.simple_tag
def payment_(d, k):
    import locale
    locale.setlocale( locale.LC_ALL, 'en_US.UTF-8' )
    return locale.currency(d["payment_"+str(k)],symbol=False)

@register.simple_tag
def payment_type_(d, k):
    value = d["payment_type_"+str(k)]
    return value if value is not None else ""

@register.simple_tag
def total_(d, k):
    import locale
    locale.setlocale( locale.LC_ALL, 'en_US.UTF-8' )
    return locale.currency(d["total_"+str(k)],symbol=False)

@register.filter
def order_by(queryset, args):
    args = [x.strip() for x in args.split(',')]
    return queryset.order_by(*args)

@register.filter()
def get_month_lang_es(date, args):
    months = (
        ('JAN','ENE'),
        ('FEB','FEB'),
        ('MAR','MAR'),
        ('APR','ABR'),
        ('MAY','MAY'),
        ('JUN','JUN'),
        ('JUL','JUL'),
        ('AUG','AGO'),
        ('SEP','SEP'),
        ('OCT','OCT'),
        ('NOV','NOV'),
        ('DIC','DIC'),
    )
    for month in months:
        date = date.replace(month[0], month[1])
    return date

@register.filter
def get_comment_lang_es(txt):
    comments = (
        ('One way','Viaje simple '),
        ('Round trip','Viaje redondo '),
        ('SHARED SERVICE','COLECTIVO'),
        ('PRIVATE SERVICE','PRIVADO'),
        ('room charge','Cargo habitación'),
    )
    for comment in comments:
        txt = txt.replace(comment[0], comment[1])
    return txt

@register.filter
def get_month_lang_po(date, args):
    months = (
        ('JAN','JAN'),
        ('FEB','FEV'),
        ('MAR','MAR'),
        ('APR','ABR'),
        ('MAY','MAI'),
        ('JUN','JUN'),
        ('JUL','JUL'),
        ('AUG','AGO'),
        ('SEP','SET'),
        ('OCT','OUT'),
        ('NOV','NOV'),
        ('DIC','DEZ'),
    )
    for month in months:
        date = date.replace(month[0], month[1])
    return date

@register.filter
def get_comment_lang_po(txt):
    comments = (
        ('One way','Viagem simples '),
        ('Round trip','Viagem ida e volta '),
        ('SHARED SERVICE','COMPARTILHADO'),
        ('PRIVATE SERVICE','PRIVADO'),
        ('room charge','custo do quarto'),
    )
    for comment in comments:
        txt = txt.replace(comment[0], comment[1])
    return txt

@register.filter()
def get_day_week_es(date, args):
    days = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"]
    return days[int(date)]

@register.filter()
def get_day_week_en(date, args):
    days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
    return days[int(date)]

@register.filter
def get_upper_correcction_text(text, args):
    characters = (
        ('Á','&#193;'),
        ('É','&#201;'),
        ('Í','&#205;'),
        ('Ó','&#211;'),
        ('Ú','&#218;')
    )
    for character in characters:
        text_ = text.replace(character[0], character[1])
        text = text_
    print(text)
    return text

@register.filter
def get_lower_correcction_text(text, args):
    characters = (
        ('á','&#225;'),
        ('é','&#233;'),
        ('í','&#237;'),
        ('ó','&#243;'),
        ('ú','&#250;')
    )
    for character in characters:
        print(character[0])
        print(character[1])
        text = text.replace(character[0], character[1])
    print(text)
    return text