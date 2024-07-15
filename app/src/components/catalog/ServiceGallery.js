import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CardTitle, CardSubtitle, Button, Row, Col, Card, CardImg, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
class ServiceGallery extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeFile = this.onChangeFile.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.toggle = this.toggle.bind(this);
        this.state={
            data:[],
            service:null,
            post:false,
            form:{
                id:null,
                title:"",
                image:null,
            }
        }
    }

    addNewImagen = (row) =>{
        this.setState({
            post:true,
            form:{
                title:"",
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
		this.setState(function (prevState) {
			return {
				form: {
					...prevState.form,
                    [event.target.name]:event.target.files[0],
				},
			};
		});
    }

    onSubmit(e){
        e.preventDefault();
        this.setState({
            post:false
        });
        let form_data = new FormData();
        form_data.append("image", this.state.form.image, this.state.form.image.name);
        form_data.append("title", this.state.form.title);
        form_data.append("service", this.state.service);
        axios.post(`${ApiUrl}general/service_images/`, form_data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
        .then(res => {
            this.refreshList();
        });
    }

    toggle(e){
        this.setState({
            post:false
        });
    }

    refreshList(){
        axios.get(`${ApiUrl}general/service_images/`,{
            params: {service:this.state.service},
        }).then(res=>{
            this.setState({
                data:res.data.results
            });
        })
    };

    componentDidMount(){
        let service = this.props.service;
        this.setState({
            service: service
        });
    }

    componentDidUpdate(prevProps, prevState){
        if (prevState.service !== this.props.service) {
            this.setState({
                service: this.props.service
            });
            this.refreshList();
		}
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar "+row.title+" de imagenes?")){
            axios.delete(`${ApiUrl}general/service_images/${row.id}/`)
            .then(res => {
                this.refreshList();
            });
        }
    }

    render(){
        const {data, post} = this.state;
        const {title, image} = this.state.form;
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
                                        {row.title}
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
                        Imagen de servicio
                    </ModalHeader>
                    <ModalBody>
                        <Form onSubmit={this.onSubmit}>
                            <Row>
                                <Col sm={4}>
                                    <FormGroup>
                                        <Label>Titulo</Label>
                                        <Input type="text" 
                                            name="title"
                                            maxLength={10}
                                            placeholder="Titulo" 
                                            value={title}
                                            onChange={this.onChangeValue}
                                            required/>
                                    </FormGroup>
                                </Col>
                                <Col sm={8}>
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
    return <ServiceGallery {...props} history={history} />;
}