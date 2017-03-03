$(document).ready(function(){
	$("a[name='js-delete']").on('click',function(event){
		return confirm('确定要删除吗');
	});
});