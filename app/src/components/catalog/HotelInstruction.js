import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CardTitle, CardSubtitle, Button, Row, Col, Card, CardImg, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
class HotelInstruction extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeFile = this.onChangeFile.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.toggle = this.toggle.bind(this);
        this.state={
            data:[],
            hotel:null,
            post:false,
            form:{
                id:null,
                position:1,
                language:'eng',
                image:null,
            }
        }
    }

    addNewImagen = (row) =>{
        this.setState({
            post:true,
            form:{
                position:1,
                language:'eng',
                image:null,
            }
        });
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				form: {
					...prevState.form,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    onChangeFile(event) {
        let file_size = event.target.files[0].size;
        file_size = file_size/1000000;
        if(file_size < 5){
            this.setState(function (prevState) {
                return {
                    form: {
                        ...prevState.form,
                        [event.target.name]:event.target.files[0],
                    },
                };
            });
        } else {
            alert("No se admiten imagenes mayores a 5MB");
        }
		
    }

    onSubmit(e){
        e.preventDefault();
        this.setState({
            post:false
        });
        let form_data = new FormData();
        form_data.append("image", this.state.form.image, this.state.form.image.name);
        form_data.append("position", this.state.form.position);
        form_data.append("hotel", this.state.hotel);
        form_data.append("language", this.state.form.language);
        axios.post(`${ApiUrl}general/hotel_images/`, form_data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }).catch(error => {
            if(error.response.data.non_field_errors.length > 0){
                alert("La posición no puede repetirse.");
            }
        }).finally(()=>this.refreshList())
    }

    toggle(e){
        this.setState({
            post:false
        });
    }

    refreshList(){
        axios.get(`${ApiUrl}general/hotel_images/`,{
            params: {
                hotel:this.state.hotel
            },
        }).then(res=>{
            this.setState({
                data:res.data.results
            });
        })
    };

    componentDidMount(){
        let hotel = this.props.hotel;
        this.setState({
            hotel: hotel
        });
    }

    componentDidUpdate(prevProps, prevState){
        if (prevState.hotel !== this.props.hotel) {
            this.setState({
                hotel: this.props.hotel
            });
            this.refreshList();
		}
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar imagen en la posición "+row.position+"?")){
            axios.delete(`${ApiUrl}general/hotel_images/${row.id}/`)
            .then(res => {
                this.refreshList();
            });
        }
    }

    render(){
        const {data, post} = this.state;
        const {position, image, language} = this.state.form;
        const languages = {
            eng:'Ingles',
            esp:'Español',
            por:'Portugues',
        }
        return(
            <div>
                <Button className='mb-3' onClick={(e)=> this.addNewImagen()}>
                    Agregar imagen
                </Button>
                <Row>
                    {data.map((row, index) => (
                        <Col sm={3} key={row.id}>
                            <Card>
                                <CardImg
                                    alt={row.title}
                                    src={row.image}
                                    top
                                    width="100%"
                                />
                                <CardBody>
                                    <CardTitle tag="h5">
                                        <p>Posición: {row.position}</p>
                                        <p>Idioma: {languages[row.language]}</p>
                                    </CardTitle>
                                    <CardSubtitle
                                        className="mb-2 text-muted"
                                        tag="h6">
                                        {row.image.split('/').pop()}
                                    </CardSubtitle>
                                    <Button color="warning" 
                                        size='sm'
                                        onClick={(e)=> this.onDeleteRow(row)}>
                                        Eliminar <i className="bi bi-trash-fill"></i>
                                    </Button>
                                </CardBody>
                            </Card>
                        </Col>
                    ))} 
                </Row>
                <Modal
                    isOpen={post}
                    backdrop="static"
                    keyboard={false}
                    size={"lg"}
                    >
                    <ModalHeader toggle={this.toggle}>
                        Imagen de hotel
                    </ModalHeader>
                    <ModalBody>
                        <Form onSubmit={this.onSubmit}>
                            <Row>
                                <Col sm={2}>
                                    <FormGroup>
                                        <Label>Posición</Label>
                                        <Input type="number" 
                                            name="position"
                                            min={1}
                                            placeholder="Posición" 
                                            value={position}
                                            onChange={this.onChangeValue}
                                            required/>
                                    </FormGroup>
                                </Col>
                                <Col sm={3}>
                                    <FormGroup>
                                        <Label>Idioma</Label>
                                        <Input type="select" 
                                            name="language"  
                                            placeholder="Tipo" 
                                            value={language}
                                            onChange={this.onChangeValue}>
                                            <option value={'eng'}>Ingles</option>
                                            <option value={'esp'}>Español</option>
                                            <option value={'por'}>Portugues</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col sm={7}>
                                    <FormGroup>
                                        <Label>Imagen</Label>
                                        <Input type="file" 
                                            name="image"  
                                            placeholder="Imagen"
                                            onChange={this.onChangeFile}
                                            accept='image/*'
                                            required/>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <FormGroup>
                                <Button variant="primary" type="submit">
                                    Guardar
                                </Button>
                            </FormGroup>
                        </Form>
                    </ModalBody>
                </Modal>
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <HotelInstruction {...props} history={history} />;
}